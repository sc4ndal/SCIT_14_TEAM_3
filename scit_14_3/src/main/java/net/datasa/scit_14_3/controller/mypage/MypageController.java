package net.datasa.scit_14_3.controller.mypage;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.TempleService;
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
@Controller
@RequiredArgsConstructor
public class MypageController {

	private final TempleService templeService;

	@GetMapping("/mypage/edit")
	public String edit(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("isTempleAccount", principal.isTempleAccount());
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
	@GetMapping("/mypage/myreservations")
	public String myReservation() {
		return "mypage/myReservations";
	}
	
	
}
