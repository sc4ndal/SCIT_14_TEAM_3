package net.datasa.scit_14_3.controller.mypage;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.mypage.MypageEditViewDto;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.mypage.MypageService;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.user.EmailVerificationService;
import net.datasa.scit_14_3.service.user.UserService;
import net.datasa.scit_14_3.util.PasswordPolicy;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 마이페이지 - 사찰 계정(사찰정보수정)은 비밀번호 변경 + 대표이미지/영어지원여부/환불규정/유의사항을
 * 다룸. 일반회원(USER) 정보수정은 아직 없음 - 요청 들어오면 그때 추가.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class MypageController {

	private final TempleService templeService;
	private final MypageService mypageService;
	private final CloudinaryService cloudinaryService;
	private final UserService userService;
	private final EmailVerificationService emailVerificationService;

	// /mypage/edit/verify를 통과했음을 세션에 표시해두는 키. editForm이 이 값을 보고
	// /mypage/edit 직접 접근을 verify로 되돌려보낸다 - 로그아웃 시 세션과 함께 사라진다.
	private static final String EDIT_VERIFIED_SESSION_KEY = "mypageEditVerified";

	@PreAuthorize("hasRole('USER')")
	@GetMapping("/mypage")
	public String mypage(Model model) {

		return "mypage/mypage";
	}
	
	// ===== 마이페이지 허브(/mypage) 카드에서 연결되는 하위 페이지들 =====
	// 지금은 화면 껍데기만 있는 상태. 실제 데이터 바인딩은 각 기능 담당이 채운다.
	
	@GetMapping("/mypage/reservations")
	public String reservations() {
		return "mypage/myReservations";
	}
	
	@GetMapping("/mypage/reviews") // 내가 작성한 리뷰
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
	
	@GetMapping("/mypage/favorites/reviews") // 내가 좋아요 한 리뷰
	public String favoriteReviews() {
		return "mypage/favorites/reviews";
	}
	
	/** 회원정보수정 진입 전 본인확인. 카카오 회원은 비밀번호가 없어 이 단계를 건너뛰고 바로 /mypage/edit로 보낸다. */
	@GetMapping("/mypage/edit/verify")
	public String verifyPasswordForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		if (!principal.isTempleAccount() && !mypageService.getEditView(principal.getUsername()).isLocalMember()) {
			return "redirect:/mypage/edit";
		}
		model.addAttribute("nickname", principal.getNickname());
		return "mypage/verifyPassword";
	}

	@PostMapping("/mypage/edit/verify")
	public String verifyPasswordSubmit(@AuthenticationPrincipal AppUserDetails principal,
	                                    @RequestParam String password,
	                                    HttpSession session,
	                                    Model model) {
		boolean matched = principal.isTempleAccount()
				? templeService.verifyPassword(principal.getTempleId(), password)
				: userService.verifyPassword(principal.getUsername(), password);

		if (!matched) {
			model.addAttribute("nickname", principal.getNickname());
			model.addAttribute("verifyError", "비밀번호가 일치하지 않습니다.");
			return "mypage/verifyPassword";
		}
		session.setAttribute(EDIT_VERIFIED_SESSION_KEY, true);
		return "redirect:/mypage/edit";
	}

	@GetMapping("/mypage/edit")
	public String editForm(@AuthenticationPrincipal AppUserDetails principal, HttpSession session, Model model) {

		// 사찰 계정은 USER 테이블에 없어 뷰 DTO 조회가 불가 - 비밀번호 변경만 별도 흐름으로 처리한다.
		// 사찰/일반회원은 수정 내용이 많이 달라서 템플릿 자체를 분리함(templeEdit.html / userEdit.html).
		if (principal.isTempleAccount()) {
			if (session.getAttribute(EDIT_VERIFIED_SESSION_KEY) == null) {
				return "redirect:/mypage/edit/verify";
			}
			model.addAttribute("formData", templeService.getInfo(principal.getTempleId()));
			return "mypage/templeEdit";
		}

		MypageEditViewDto user = mypageService.getEditView(principal.getUsername());

		// /mypage/edit/verify를 거치지 않고 주소로 바로 들어온 경우 - 카카오 회원(비밀번호 없음)만 예외로 통과.
		if (user.isLocalMember() && session.getAttribute(EDIT_VERIFIED_SESSION_KEY) == null) {
			return "redirect:/mypage/edit/verify";
		}

		model.addAttribute("user", user);
		model.addAttribute("loginType", user.getLoginType());     // "LOCAL" | "KAKAO"
		return "mypage/userEdit";
	}

	/** 일반회원(USER) 마이페이지 회원정보수정 저장. userEdit.html의 profileForm이 여기로 온다.
	    newPassword는 선택값 - 비워두면 비밀번호는 그대로 둔다.
	    이메일은 화면(모달)에서 인증을 마쳐야 hidden #emailSubmit이 바뀌지만, 그건 클라이언트
	    로직일 뿐이라 여기서 다시 세션의 실제 인증 상태를 확인한다 - UserController.localSignup/
	    kakaoAdditionalSignup이 클라이언트가 보낸 email_verified 값을 안 믿고 세션을 직접
	    확인하는 것과 같은 이유(그 값 자체를 조작해서 임의 이메일을 등록하는 것 방지). */
	@PostMapping("/mypage/user-info")
	public String updateUserInfo(@AuthenticationPrincipal AppUserDetails principal,
	                              @RequestParam String nickname,
	                              @RequestParam(required = false) String phone,
	                              @RequestParam(required = false) String email,
	                              @RequestParam(required = false) String newPassword,
	                              @RequestParam(required = false) String newPasswordConfirm,
	                              HttpSession session,
	                              RedirectAttributes redirectAttributes) {
		nickname = nickname.trim();
		if (nickname.isBlank()) {
			redirectAttributes.addFlashAttribute("profileUpdateError", "법명을 입력해주세요.");
			return "redirect:/mypage/edit";
		}

		email = email == null ? "" : email.trim();
		if (email.isBlank()) {
			redirectAttributes.addFlashAttribute("profileUpdateError", "이메일을 입력해주세요.");
			return "redirect:/mypage/edit";
		}

		if (newPassword != null && !newPassword.isBlank()) {
			if (!PasswordPolicy.isValid(newPassword)) {
				redirectAttributes.addFlashAttribute("profileUpdateError", PasswordPolicy.INVALID_MESSAGE);
				return "redirect:/mypage/edit";
			}
			if (!newPassword.equals(newPasswordConfirm)) {
				redirectAttributes.addFlashAttribute("profileUpdateError", "변경할 비밀번호가 일치하지 않습니다.");
				return "redirect:/mypage/edit";
			}
		}

		// 지금 등록된 이메일 그대로면(변경 안 함) updateOwnProfile이 이 값을 아예 안 보므로,
		// 매번 세션을 확인해도 실제로 이메일을 바꾸려는 경우에만 의미가 있다.
		boolean emailVerified = emailVerificationService.isVerified(email, session);

		try {
			userService.updateOwnProfile(principal.getUsername(), nickname, phone, email,
					(newPassword != null && !newPassword.isBlank()) ? newPassword : null,
					emailVerified);
			redirectAttributes.addFlashAttribute("profileUpdateSuccess", true);
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("profileUpdateError", e.getMessage());
		}
		return "redirect:/mypage/edit";
	}

	/** 사찰 계정 본인이 직접 수정 가능한 값들만 - 이름/주소/위치/지역/장소유형처럼 잘못 넣으면
	    문제가 생기는 값은 빠져있음(등록 시 검증된 뒤로 고정, 변경 필요하면 문의). */
	@PostMapping("/mypage/temple-info")
	public String updateTempleInfo(@AuthenticationPrincipal AppUserDetails principal,
									@RequestParam(required = false) MultipartFile imageFile,
									@RequestParam(required = false) String existingImageUrl,
									@RequestParam(required = false, defaultValue = "false") boolean supportEnglish,
									@RequestParam(required = false) String refundPolicy,
									@RequestParam(required = false) String specialNotice,
									RedirectAttributes redirectAttributes) {
		String imageUrl = existingImageUrl;
		if (imageFile != null && !imageFile.isEmpty()) {
			imageUrl = cloudinaryService.upload(imageFile);
		}
		templeService.updateOwnInfo(principal.getTempleId(), imageUrl, supportEnglish, refundPolicy, specialNotice);
		redirectAttributes.addFlashAttribute("templeInfoSuccess", true);
		return "redirect:/mypage/edit";
	}

	@PostMapping("/mypage/temple-info/remove-image")
	public String removeTempleImage(@AuthenticationPrincipal AppUserDetails principal,
									 RedirectAttributes redirectAttributes) {
		templeService.removeImage(principal.getTempleId());
		redirectAttributes.addFlashAttribute("templeInfoSuccess", true);
		return "redirect:/mypage/edit";
	}

	@PostMapping("/mypage/temple-password")
	public String changeTemplePassword(@AuthenticationPrincipal AppUserDetails principal,
										@RequestParam String currentPassword,
										@RequestParam String newPassword,
										RedirectAttributes redirectAttributes) {
		if (newPassword == null || newPassword.isBlank()) {
			redirectAttributes.addFlashAttribute("passwordChangeError", "새 비밀번호를 입력해주세요.");
			return "redirect:/mypage/edit";
		}

		try {
			templeService.changePassword(principal.getTempleId(), currentPassword, newPassword);
			redirectAttributes.addFlashAttribute("passwordChangeSuccess", true);
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("passwordChangeError", e.getMessage());
		}
		return "redirect:/mypage/edit";
	}
}
