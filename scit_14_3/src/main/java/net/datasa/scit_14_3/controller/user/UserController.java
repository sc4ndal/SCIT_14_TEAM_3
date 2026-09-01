package net.datasa.scit_14_3.controller.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.user.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.user.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.user.UserResponseDto;
import net.datasa.scit_14_3.domain.dto.kakao.KakaoTokenResponse;
import net.datasa.scit_14_3.domain.dto.kakao.KakaoUserInfoResponse;
import net.datasa.scit_14_3.exception.DuplicateFieldException;
import net.datasa.scit_14_3.security.SessionLoginService;
import net.datasa.scit_14_3.service.user.EmailVerificationService;
import net.datasa.scit_14_3.service.user.KakaoOAuthService;
import net.datasa.scit_14_3.service.user.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Controller
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;
	private final KakaoOAuthService kakaoOAuthService;
	private final SessionLoginService sessionLoginService;
	private final EmailVerificationService emailVerificationService;

	private static final String PENDING_KAKAO_ID = "pendingKakaoId";
	private static final String PENDING_KAKAO_EMAIL = "pendingKakaoEmail";
	private static final String PENDING_KAKAO_NICKNAME = "pendingKakaoNickname";

	@GetMapping("/login")
	public String login() {
		return "auth/login";
	}

	@GetMapping("/signupSelect")
	public String signupSelect() {
		return "auth/signupSelect";
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

		return "auth/signup";
	}

	// ================= 중복확인 (아이디/닉네임/이메일) =================
	// user 테이블 기준으로 그대로 조회. signup.js의 checkDuplicate()/checkEmailDuplicate()가 호출함.

	@GetMapping("/api/check/login-id")
	@ResponseBody
	public Map<String, Boolean> checkLoginId(@RequestParam String value) {
		return Map.of("available", userService.isLoginIdAvailable(value));
	}

	@GetMapping("/api/check/nickname")
	@ResponseBody
	public Map<String, Boolean> checkNickname(@RequestParam String value) {
		return Map.of("available", userService.isNicknameAvailable(value));
	}

	@GetMapping("/api/check/email")
	@ResponseBody
	public Map<String, Boolean> checkEmail(@RequestParam String value) {
		return Map.of("available", userService.isEmailAvailable(value));
	}

	// ================= 이메일 인증 (회원가입용) =================
	// signup.js의 sendVerificationMail()/confirmCode()가 호출함. 코드/인증완료 상태는 세션에만 둠.

	@PostMapping("/api/email/send-verification")
	@ResponseBody
	public Map<String, Boolean> sendEmailVerification(@RequestBody Map<String, String> body, HttpSession session) {
		emailVerificationService.sendVerificationCode(body.get("email"), session);
		return Map.of("sent", true);
	}

	@PostMapping("/api/email/verify-code")
	@ResponseBody
	public Map<String, Boolean> verifyEmailCode(@RequestBody Map<String, String> body, HttpSession session) {
		boolean verified = emailVerificationService.verifyCode(body.get("email"), body.get("code"), session);
		return Map.of("verified", verified);
	}

	// ================= 로컬 회원가입 =================

	@PostMapping("/signup/local")
	public String localSignup(@Valid @ModelAttribute LocalSignupRequestDto request,
	                          BindingResult bindingResult,
	                          RedirectAttributes redirectAttributes,
	                          HttpSession session,
	                          HttpServletRequest httpRequest,
	                          HttpServletResponse httpResponse,
							  Model model) {
		
		// email_verified hidden 필드는 화면 표시용일 뿐 안 믿음 - 세션에 실제로 인증된 이메일인지 직접 확인.
		// 이메일은 필수 입력으로 취급함.
		String email = request.getEmail();
		if (email == null || email.isBlank() || !emailVerificationService.isVerified(email, session)) {
			redirectAttributes.addFlashAttribute("signupError", "이메일 인증을 완료해주세요.");
			return "redirect:/signup?mode=local";
		}

		try {
			UserResponseDto user = userService.registerLocal(request);
			sessionLoginService.loginAs(user, httpRequest, httpResponse);
			return "redirect:/?signup=success";
		} catch (DuplicateFieldException e) {
			log.info("로컬 회원가입 실패: {}", e.getMessage());
			redirectAttributes.addFlashAttribute("signupError", e.getMessage());
			return "redirect:/signup";
		}
	}

	// ================= 카카오 로그인 =================

	/** intent=signup(회원가입 버튼) / login(로그인 버튼) - 콜백에서 계정 존재 여부와
	    같이 봐서 "가입 버튼인데 이미 회원" / "로그인 버튼인데 미가입" 케이스를 갈라내는 데 씀. */
	@GetMapping("/login/kakao")
	public String kakaoRedirect(@RequestParam(required = false, defaultValue = "login") String intent) {
		return "redirect:" + kakaoOAuthService.buildAuthorizeUrl(intent);
	}

	@GetMapping("/login/kakao/callback")
	public String kakaoCallback(@RequestParam String code,
								 @RequestParam(required = false, defaultValue = "login") String state,
								 HttpSession session,
								 RedirectAttributes redirectAttributes,
								 HttpServletRequest request,
								 HttpServletResponse response) {

		KakaoTokenResponse token = kakaoOAuthService.getAccessToken(code);
		KakaoUserInfoResponse kakaoUser = kakaoOAuthService.getUserInfo(token.getAccessToken());

		String loginId = "kakao_" + kakaoUser.getId();
		boolean intentIsSignup = "signup".equals(state);

		// 로그아웃할 때 이 토큰으로 카카오 REST API 로그아웃을 호출함(브라우저 화면 안 거치고
		// 서버 대 서버로 바로 처리됨) - 그래야 다음 로그인 때 카카오가 다시 인증을 물어봄.
		session.setAttribute(KakaoOAuthService.ACCESS_TOKEN_SESSION_KEY, token.getAccessToken());

		Optional<UserResponseDto> existing = userService.findByLoginId(loginId);

		if (existing.isPresent() && intentIsSignup) {
			// "카카오로 가입하기"를 눌렀는데 이미 가입된 계정 -> 그냥 로그인시켜버리지 않고
			// 로그인 페이지로 안내만 함 (가입 버튼 눌렀는데 조용히 로그인되면 헷갈림)
			redirectAttributes.addFlashAttribute("loginNotice", "이미 가입된 카카오 계정입니다. 로그인해주세요.");
			return "redirect:/login";
		}

		// "카카오로 로그인"을 눌렀는데 가입된 계정이 없으면 -> signupSelect로 돌려보내지 않고,
		// 이미 인증받은 이 카카오 정보 그대로 살려서 바로 아래 orElseGet(신규가입 플로우)으로 진행함.
		// (다시 카카오 인증을 거치게 하는 건 불필요한 왕복이라 안 함)

		return existing
				.map(user -> {
					// 이미 가입된 카카오 회원(그리고 로그인 의도) -> 바로 로그인
					sessionLoginService.loginAs(user, token.getAccessToken(), request, response);
					return "redirect:/";
				})
				.orElseGet(() -> {
					// 처음 로그인하는 카카오 계정(그리고 가입 의도) -> 세션에 카카오 회원번호/이메일/닉네임을
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
	public String kakaoAdditionalSignup(@Valid @ModelAttribute KakaoAdditionalRequestDto request,
	                                    BindingResult bindingResult,
										 HttpSession session,
										 RedirectAttributes redirectAttributes,
										 HttpServletRequest httpRequest,
										 HttpServletResponse httpResponse,
										Model model) throws BindException {
		Object pendingKakaoId = session.getAttribute(PENDING_KAKAO_ID);
		if (pendingKakaoId == null) {
			redirectAttributes.addFlashAttribute("signupError", "카카오 인증 세션이 없습니다. 처음부터 다시 시도해주세요.");
			return "redirect:/signupSelect";
		}
		
		if (bindingResult.hasErrors()) {
			// 검증 실패 → 카카오 인증 세션 폐기 후 공통 에러 처리에 위임
			session.removeAttribute(PENDING_KAKAO_ID);
			session.removeAttribute(PENDING_KAKAO_EMAIL);
			session.removeAttribute(PENDING_KAKAO_NICKNAME);
			session.removeAttribute(KakaoOAuthService.ACCESS_TOKEN_SESSION_KEY);
			throw new BindException(bindingResult);   // → GlobalExceptionHandler.handleBind()
		}

		// 로컬 회원가입과 동일하게 이메일을 필수로 요구함 - 클라이언트가 보낸 값은 안 믿고
		// 세션에 실제로 인증된 이메일인지 서버가 직접 확인 (카카오 세션은 유지해서 같은 폼에서 재시도 가능)
		String email = request.getEmail();
		if (email == null || email.isBlank() || !emailVerificationService.isVerified(email, session)) {
			redirectAttributes.addFlashAttribute("signupError", "이메일 인증을 완료해주세요.");
			return "redirect:/signup?mode=kakao";
		}

		try {
			UserResponseDto user = userService.registerKakao((Long) pendingKakaoId, request);
			String kakaoAccessToken = (String) session.getAttribute(KakaoOAuthService.ACCESS_TOKEN_SESSION_KEY);
			session.removeAttribute(PENDING_KAKAO_ID);
			session.removeAttribute(PENDING_KAKAO_EMAIL);
			session.removeAttribute(PENDING_KAKAO_NICKNAME);
			sessionLoginService.loginAs(user, kakaoAccessToken, httpRequest, httpResponse);
			return "redirect:/?signup=success";
		} catch (DuplicateFieldException e) {
			log.info("카카오 추가정보 가입 실패: {}", e.getMessage());
			redirectAttributes.addFlashAttribute("signupError", e.getMessage());
			return "redirect:/signup?mode=kakao";
		}
	}
	
	/////////////////////////////////////////////
	/// 여기서 부터 마이페이지
	@PreAuthorize(("hasRole('USER')"))
	@GetMapping("/mypage")
	public String mypage(Model model) {

		return "mypage/mypage";
	}

	// /mypage/edit은 MypageController가 담당함 (중복 매핑이라 여기서는 뺌)

	// ===== 마이페이지 허브(/mypage) 카드에서 연결되는 하위 페이지들 =====
	// 지금은 화면 껍데기만 있는 상태. 실제 데이터 바인딩은 각 기능 담당이 채운다.
	
	@GetMapping("/mypage/myReservations")
	public String reservations() {
		return "mypage/myReservations";
	}
	
	@GetMapping("/mypage/myReviews")
	public String reviews() {
		return "mypage/myReviews";
	}
	
	@GetMapping("/mypage/favorites/temples")
	public String favoriteTemples() {
		return "mypage/favorites/temples";
	}
	
	@GetMapping("/mypage/favorites/events")
	public String favoriteEvents() {
		return "mypage/favorites/events";
	}
	
	@GetMapping("/mypage/favorites/quotes")
	public String favoriteQuotes() {
		return "mypage/favorites/quotes";
	}
	
	@GetMapping("/mypage/favorites/foods")
	public String favoriteFoods() {
		return "mypage/favorites/foods";
	}
	
	@GetMapping("/mypage/favorites/reviews")
	public String favoriteReviews() {
		return "mypage/favorites/reviews";
	}
}
