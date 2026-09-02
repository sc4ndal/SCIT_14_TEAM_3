package net.datasa.scit_14_3.controller.mypage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.mypage.MypageEditViewDto;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.mypage.MypageService;
import net.datasa.scit_14_3.service.temple.TempleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 마이페이지 - 지금은 사찰 계정의 비밀번호 변경만 다룸.
 * 일반회원(USER) 정보수정은 아직 없음 - 요청 들어오면 그때 추가.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class MypageController {

	private final TempleService templeService;
	private final MypageService mypageService;
	
	@PreAuthorize(("hasRole('USER')"))
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
	
	@GetMapping("/mypage/edit")
	public String editForm(@AuthenticationPrincipal AppUserDetails principal, Model model) {

		// 사찰 계정은 USER 테이블에 없어 뷰 DTO 조회가 불가 - 비밀번호 변경만 별도 흐름으로 처리한다.
		// (edit.html은 ${user.*} 를 참조하므로 사찰용 화면은 추후 분리 권장)
		if (principal.isTempleAccount()) {
			model.addAttribute("isTempleAccount", true);
			model.addAttribute("loginType", "TEMPLE");
			model.addAttribute("isLocalMember", false);
			return "mypage/edit";
		}

		MypageEditViewDto user = mypageService.getEditView(principal.getUsername());
		model.addAttribute("user", user);
		model.addAttribute("loginType", user.getLoginType());     // "LOCAL" | "KAKAO"
		model.addAttribute("isLocalMember", user.isLocalMember());
		model.addAttribute("isTempleAccount", false);
		return "mypage/edit";
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
