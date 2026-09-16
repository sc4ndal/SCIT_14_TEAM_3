package net.datasa.scit_14_3.controller.mypage;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.mypage.MypageEditViewDto;
import net.datasa.scit_14_3.domain.dto.user.UserResponseDto;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.security.SessionLoginService;
import net.datasa.scit_14_3.service.buddhism.DailyQuoteService;
import net.datasa.scit_14_3.service.buddhism.TempleFoodService;
import net.datasa.scit_14_3.service.mypage.MypageService;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
import net.datasa.scit_14_3.service.temple.TempleEventService;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import net.datasa.scit_14_3.service.templestay.TempleStayReviewService;
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

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

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
	private final DailyQuoteService dailyQuoteService;
	private final TempleFoodService templeFoodService;
	private final TempleEventService templeEventService;
	private final TempleStayReviewService templeStayReviewService;
	private final TempleStayReservationService templeStayReservationService;
	private final SessionLoginService sessionLoginService;
	private final ExecutorService mypageCountExecutor;

	// 서로 무관한 배지 카운트 7개를 순차로 조회하면 원격 DB(Aiven) 왕복이 그대로 다 더해져서
	// (왕복 1초씩만 잡아도 7초+) 느렸다 - CompletableFuture로 한 번에 동시에 날려서
	// 제일 느린 쿼리 하나만큼의 시간으로 줄인다(mypageCountExecutor 참고).
	@PreAuthorize("hasRole('USER')")
	@GetMapping("/mypage")
	public String mypage(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		String loginId = principal.getUsername();

		CompletableFuture<Long> reservationCount = CompletableFuture.supplyAsync(
				() -> templeStayReservationService.countMyReservations(loginId), mypageCountExecutor);
		CompletableFuture<Long> myReviewCount = CompletableFuture.supplyAsync(
				() -> templeStayReviewService.countMyReviews(loginId), mypageCountExecutor);
		CompletableFuture<Long> favoriteTempleCount = CompletableFuture.supplyAsync(
				() -> favoriteTempleService.countFavorites(loginId), mypageCountExecutor);
		CompletableFuture<Long> favoriteEventCount = CompletableFuture.supplyAsync(
				() -> templeEventService.countFavorites(loginId), mypageCountExecutor);
		CompletableFuture<Long> favoriteQuoteCount = CompletableFuture.supplyAsync(
				() -> dailyQuoteService.countFavorites(loginId), mypageCountExecutor);
		CompletableFuture<Long> favoriteFoodCount = CompletableFuture.supplyAsync(
				() -> templeFoodService.countFavorites(loginId), mypageCountExecutor);
		CompletableFuture<Long> favoriteReviewCount = CompletableFuture.supplyAsync(
				() -> templeStayReviewService.countFavoriteReviews(loginId), mypageCountExecutor);

		CompletableFuture.allOf(reservationCount, myReviewCount, favoriteTempleCount, favoriteEventCount,
				favoriteQuoteCount, favoriteFoodCount, favoriteReviewCount).join();

		model.addAttribute("reservationCount", reservationCount.join());
		model.addAttribute("myReviewCount", myReviewCount.join());
		model.addAttribute("favoriteTempleCount", favoriteTempleCount.join());
		model.addAttribute("favoriteEventCount", favoriteEventCount.join());
		model.addAttribute("favoriteQuoteCount", favoriteQuoteCount.join());
		model.addAttribute("favoriteFoodCount", favoriteFoodCount.join());
		model.addAttribute("favoriteReviewCount", favoriteReviewCount.join());

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

	// 예약목록의 "리뷰 작성" 버튼에서 연결 - 실제 데이터 조회/검증은 reviewWrite.js가 REST API로 처리
	@GetMapping("/mypage/reviews/write")
	public String reviewWrite() {
		return "mypage/reviewWrite";
	}
	
	@GetMapping("/mypage/favorites/temples")
	public String favoriteTemples(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("temples", favoriteTempleService.getFavorites(principal.getUsername()));
		return "mypage/favorites/temples";
	}
	
	@GetMapping("/mypage/favorites/events")
	public String favoriteEvents(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("events", templeEventService.getFavorites(principal.getUsername()));
		return "mypage/favorites/events";
	}
	
	@GetMapping("/mypage/favorites/quotes")
	public String favoriteQuotes(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("quotes", dailyQuoteService.getFavorites(principal.getUsername()));
		return "mypage/favorites/quotes";
	}

	@GetMapping("/mypage/favorites/foods")
	public String favoriteFoods(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("foods", templeFoodService.getFavorites(principal.getUsername()));
		return "mypage/favorites/foods";
	}
	
	@GetMapping("/mypage/favorites/reviews") // 내가 좋아요 한 리뷰
	public String favoriteReviews(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("reviews", templeStayReviewService.getFavoriteReviews(principal.getUsername()));
		return "mypage/favorites/reviews";
	}
	
	/** 회원정보수정 들어가기 전 본인 확인 - 비밀번호를 다시 입력받음. 카카오 회원은 password 컬럼
	    자체가 null이라(가입 시 비밀번호를 받지 않음) 재입력받을 비밀번호가 없으므로 건너뛴다.
	    "카카오 로그인이냐"는 DB를 다시 조회할 필요 없이, 로그인 시점에 서버가 세션 principal에
	    이미 심어둔 kakaoAccessToken으로 판단한다(SessionLoginService.loginAs 참고 - 폼로그인 경로는
	    이 값이 항상 null). */
	@GetMapping("/mypage/edit/verify")
	public String editVerifyForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		if (!principal.isTempleAccount() && principal.getKakaoAccessToken() != null) {
			return "redirect:/mypage/edit";
		}
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

	// ===== 회원 탈퇴 (일반회원 전용) =====
	// 예약/리뷰 기록이 있으면 하드 삭제가 불가능해서(UserService 주석 참고) "탈퇴 신청 ->
	// 30일 유예 -> 확정 시 익명화" 흐름을 쓴다. 유예기간 중 재로그인하면 successHandler가
	// 이 화면(/mypage/withdrawal/pending)으로 보내고, WithdrawalGateFilter가 그 외 다른 페이지
	// 접근을 막는다.

	@PreAuthorize("hasRole('USER')")
	@GetMapping("/mypage/withdrawal")
	public String withdrawalForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("isLocalAccount", isLocalAccount(principal));
		model.addAttribute("gracePeriodDays", UserService.WITHDRAWAL_GRACE_PERIOD_DAYS);
		return "mypage/withdrawal";
	}

	/** 탈퇴 신청 직후 세션 principal도 바로 withdrawalPending=true로 새로 고친다(cancelWithdrawal과
	    대칭) - 그래야 신청한 순간부터 WithdrawalGateFilter가 곧장 철회 화면 외 접근을 막는다.
	    안 그러면 로그아웃하기 전까진 이미 로그인된 세션으로 평소처럼 계속 이용할 수 있어서
	    유예기간 중 이용 제한이 무의미해진다. */
	@PreAuthorize("hasRole('USER')")
	@PostMapping("/mypage/withdrawal")
	public String requestWithdrawal(@AuthenticationPrincipal AppUserDetails principal,
									 @RequestParam(required = false) String password,
									 HttpServletRequest request, HttpServletResponse response,
									 RedirectAttributes redirectAttributes) {
		UserResponseDto refreshed;
		try {
			refreshed = userService.requestWithdrawal(principal.getUsername(), password);
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("withdrawalError", e.getMessage());
			return "redirect:/mypage/withdrawal";
		}
		sessionLoginService.loginAs(refreshed, principal.getKakaoAccessToken(), request, response);
		return "redirect:/mypage/withdrawal/pending";
	}

	/** 유예기간 중 재로그인하면 successHandler가 도착시키는 철회 화면. 세션은 여전히
	    withdrawalPending=true인데 DB에서는 이미 철회된(다른 탭에서 철회 등) 드문 경우를 대비해
	    최신 상태를 다시 확인한다 - 이미 풀렸다면 세션 principal도 같이 새로 고쳐야 한다.
	    안 그러면 WithdrawalGateFilter가 여전히 pending으로 보고 /mypage로 못 나가게 다시
	    이 화면으로 되돌려보내 리다이렉트 루프가 생긴다. */
	@PreAuthorize("hasRole('USER')")
	@GetMapping("/mypage/withdrawal/pending")
	public String withdrawalPending(@AuthenticationPrincipal AppUserDetails principal, Model model,
									 HttpServletRequest request, HttpServletResponse response) {
		UserResponseDto user = userService.findByLoginId(principal.getUsername())
				.orElseThrow(() -> new IllegalStateException("회원 정보를 찾을 수 없습니다."));
		if (user.getWithdrawalRequestedAt() == null) {
			sessionLoginService.loginAs(user, principal.getKakaoAccessToken(), request, response);
			return "redirect:/mypage";
		}
		model.addAttribute("withdrawalRequestedAt", user.getWithdrawalRequestedAt());
		model.addAttribute("gracePeriodDays", UserService.WITHDRAWAL_GRACE_PERIOD_DAYS);
		return "mypage/withdrawalPending";
	}

	/** 탈퇴 철회 - 세션에 들고 있던 principal도 withdrawalPending=false로 새로 고쳐야
	    WithdrawalGateFilter가 더 이상 이 화면에 가두지 않는다. */
	@PreAuthorize("hasRole('USER')")
	@PostMapping("/mypage/withdrawal/cancel")
	public String cancelWithdrawal(@AuthenticationPrincipal AppUserDetails principal,
									HttpServletRequest request, HttpServletResponse response,
									RedirectAttributes redirectAttributes) {
		UserResponseDto refreshed = userService.cancelWithdrawal(principal.getUsername());
		sessionLoginService.loginAs(refreshed, principal.getKakaoAccessToken(), request, response);
		redirectAttributes.addFlashAttribute("withdrawalCancelled", true);
		return "redirect:/mypage";
	}

	private boolean isLocalAccount(AppUserDetails principal) {
		return userService.findByLoginId(principal.getUsername())
				.map(u -> u.getLoginType() == UserEntity.LoginType.LOCAL)
				.orElse(true);
	}
}
