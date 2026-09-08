package net.datasa.scit_14_3.controller.mypage;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.mypage.MypageEditViewDto;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.buddhism.DailyQuoteService;
import net.datasa.scit_14_3.service.buddhism.TempleFoodService;
import net.datasa.scit_14_3.service.mypage.MypageService;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
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
	private final FavoriteTempleService favoriteTempleService;

	@PreAuthorize("hasRole('USER')")
	@GetMapping("/mypage")
	public String mypage(Model model) {

		return "mypage/mypage";
	}
	
	// ===== 마이페이지 허브(/mypage) 카드에서 연결되는 하위 페이지들 =====
	// 지금은 화면 껍데기만 있는 상태. 실제 데이터 바인딩은 각 기능 담당이 채운다.
	
	@GetMapping("/mypage/myReservations")
	public String reservations() {
		return "mypage/myReservations";
	}

	@GetMapping("/mypage/myReviews") // 내가 작성한 리뷰
	public String reviews() {
		return "mypage/myReviews";
	}
	
	@GetMapping("/mypage/favorites/temples")
	public String favoriteTemples(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("temples", favoriteTempleService.getFavorites(principal.getUsername()));
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
	
	/** 회원정보수정 들어가기 전 본인 확인 - 비밀번호를 다시 입력받음. */
	@GetMapping("/mypage/edit/verify")
	public String editVerifyForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("nickname", principal.getNickname());
		return "mypage/verifyPassword";
	}

	@PostMapping("/mypage/edit/verify")
	public String editVerify(@AuthenticationPrincipal AppUserDetails principal,
							  @RequestParam String password,
							  Model model) {
		boolean ok = principal.isTempleAccount()
				? templeService.verifyPassword(principal.getTempleId(), password)
				: userService.verifyPassword(principal.getUsername(), password);

		if (!ok) {
			model.addAttribute("nickname", principal.getNickname());
			model.addAttribute("verifyError", "비밀번호가 일치하지 않습니다.");
			return "mypage/verifyPassword";
		}
		return "redirect:/mypage/edit";
	}

	@GetMapping("/mypage/edit")
	public String editForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {

		// 사찰 계정은 USER 테이블에 없어 뷰 DTO 조회가 불가 - 비밀번호 변경만 별도 흐름으로 처리한다.
		// 사찰/일반회원은 수정 내용이 많이 달라서 템플릿 자체를 분리함(templeEdit.html / userEdit.html).
		if (principal.isTempleAccount()) {
			model.addAttribute("formData", templeService.getInfo(principal.getTempleId()));
			return "mypage/templeEdit";
		}

		MypageEditViewDto user = mypageService.getEditView(principal.getUsername());
		model.addAttribute("user", user);
		model.addAttribute("loginType", user.getLoginType());     // "LOCAL" | "KAKAO"
		return "mypage/userEdit";
	}

	/** 일반회원 마이페이지(회원정보수정) 저장. 이메일을 실제로 바꾸는 경우에만 서버가 세션에서
	    직접 인증 여부를 확인함(클라이언트 값은 안 믿음 - registerLocal과 같은 원칙). */
	@PostMapping("/mypage/user-info")
	public String updateUserInfo(@AuthenticationPrincipal AppUserDetails principal,
								  @RequestParam String nickname,
								  @RequestParam(required = false) String phone,
								  @RequestParam String email,
								  @RequestParam(required = false) String newPassword,
								  HttpSession session,
								  RedirectAttributes redirectAttributes) {
		try {
			boolean emailVerified = emailVerificationService.isVerified(email, session);
			userService.updateOwnProfile(principal.getUsername(), nickname, phone, email, newPassword, emailVerified);
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
