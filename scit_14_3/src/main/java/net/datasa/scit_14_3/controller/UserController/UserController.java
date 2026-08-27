package net.datasa.scit_14_3.controller.UserController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.kakao.KakaoTokenResponse;
import net.datasa.scit_14_3.domain.dto.kakao.KakaoUserInfoResponse;
import net.datasa.scit_14_3.domain.entity.UserEntity;
import net.datasa.scit_14_3.repository.UserRepository;
import net.datasa.scit_14_3.security.SessionLoginService;
import net.datasa.scit_14_3.service.KakaoOAuthService;
import net.datasa.scit_14_3.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Slf4j
@Controller
@RequiredArgsConstructor
public class UserController {

	private final UserRepository userRepository;
	private final UserService userService;
	private final KakaoOAuthService kakaoOAuthService;
	private final SessionLoginService sessionLoginService;

	private static final String PENDING_KAKAO_ID = "pendingKakaoId";
	private static final String PENDING_KAKAO_EMAIL = "pendingKakaoEmail";
	private static final String PENDING_KAKAO_NICKNAME = "pendingKakaoNickname";

	@GetMapping("/login")
	public String login() {
		return "login";
	}

	@GetMapping("/signupSelect")
	public String signupSelect() {
		return "signupSelect";
	}

	@GetMapping("/signup")
	public String signup(@RequestParam(required = false) String mode, Model model, HttpSession session) {
		model.addAttribute("mode", mode); // "local" 또는 "kakao" 또는 null

		if ("kakao".equals(mode)) {
			// signup.html의 kakao_id hidden 필드는 화면 표시/디버그용일 뿐이고,
			// 실제 가입 처리(POST /signup/kakao-additional)는 이 값을 신뢰하지 않고
			// 세션의 pendingKakaoId만 사용합니다 (hidden 필드는 브라우저에서 조작 가능하므로).
			Object kakaoId = session.getAttribute(PENDING_KAKAO_ID);
			if (kakaoId == null) {
				// 카카오 인증 절차 없이 /signup?mode=kakao로 직접 들어온 경우 -> 처음부터 다시
				return "redirect:/signupSelect";
			}
			model.addAttribute("kakaoId", kakaoId);
			model.addAttribute("kakaoEmail", session.getAttribute(PENDING_KAKAO_EMAIL));
			model.addAttribute("kakaoNickname", session.getAttribute(PENDING_KAKAO_NICKNAME));
		}

		return "signup";
	}

	// ================= 로컬 회원가입 =================

	@PostMapping("/signup/local")
	public String localSignup(@ModelAttribute LocalSignupRequestDto request,
							   RedirectAttributes redirectAttributes,
							   HttpServletRequest httpRequest,
							   HttpServletResponse httpResponse) {
		try {
			UserEntity user = userService.registerLocal(request);
			sessionLoginService.loginAs(user, httpRequest, httpResponse);
			return "redirect:/";
		} catch (IllegalStateException e) {
			log.info("로컬 회원가입 실패: {}", e.getMessage());
			redirectAttributes.addFlashAttribute("signupError", e.getMessage());
			return "redirect:/signup";
		}
	}

	// ================= 카카오 로그인 =================

	@GetMapping("/login/kakao")
	public String kakaoRedirect() {
		return "redirect:" + kakaoOAuthService.buildAuthorizeUrl();
	}

	@GetMapping("/login/kakao/callback")
	public String kakaoCallback(@RequestParam String code,
								 HttpSession session,
								 HttpServletRequest request,
								 HttpServletResponse response) {

		KakaoTokenResponse token = kakaoOAuthService.getAccessToken(code);
		KakaoUserInfoResponse kakaoUser = kakaoOAuthService.getUserInfo(token.getAccessToken());

		String loginId = "kakao_" + kakaoUser.getId();

		return userRepository.findById(loginId)
				.map(user -> {
					// 이미 가입된 카카오 회원 -> 바로 로그인
					sessionLoginService.loginAs(user, request, response);
					return "redirect:/";
				})
				.orElseGet(() -> {
					// 처음 로그인하는 카카오 계정 -> 세션에 카카오 회원번호/이메일/닉네임을
					// 임시 저장하고 추가 정보 입력 화면(signup.html, mode=kakao)으로 이동.
					session.setAttribute(PENDING_KAKAO_ID, kakaoUser.getId());
					if (kakaoUser.getKakaoAccount() != null) {
						if (kakaoUser.getKakaoAccount().getEmail() != null) {
							session.setAttribute(PENDING_KAKAO_EMAIL, kakaoUser.getKakaoAccount().getEmail());
						}
						if (kakaoUser.getKakaoAccount().getProfile() != null
								&& kakaoUser.getKakaoAccount().getProfile().getNickname() != null) {
							session.setAttribute(PENDING_KAKAO_NICKNAME,
									kakaoUser.getKakaoAccount().getProfile().getNickname());
						}
					}
					return "redirect:/signup?mode=kakao";
				});
	}

	@PostMapping("/signup/kakao-additional")
	public String kakaoAdditionalSignup(@ModelAttribute KakaoAdditionalRequestDto request,
										 HttpSession session,
										 RedirectAttributes redirectAttributes,
										 HttpServletRequest httpRequest,
										 HttpServletResponse httpResponse) {
		Object pendingKakaoId = session.getAttribute(PENDING_KAKAO_ID);
		if (pendingKakaoId == null) {
			redirectAttributes.addFlashAttribute("signupError", "카카오 인증 세션이 없습니다. 처음부터 다시 시도해주세요.");
			return "redirect:/signupSelect";
		}

		try {
			UserEntity user = userService.registerKakao((Long) pendingKakaoId, request);
			session.removeAttribute(PENDING_KAKAO_ID);
			session.removeAttribute(PENDING_KAKAO_EMAIL);
			session.removeAttribute(PENDING_KAKAO_NICKNAME);
			sessionLoginService.loginAs(user, httpRequest, httpResponse);
			return "redirect:/";
		} catch (IllegalStateException e) {
			log.info("카카오 추가정보 가입 실패: {}", e.getMessage());
			redirectAttributes.addFlashAttribute("signupError", e.getMessage());
			return "redirect:/signup?mode=kakao";
		}
	}
}
