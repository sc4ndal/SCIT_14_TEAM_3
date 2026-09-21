package net.datasa.scit_14_3.controller.inquiry;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.inquiry.TempleInquiryDto;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.inquiry.TempleInquiryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** 일반회원이 사찰에게 남기는 1:1 문의 - 24시간 이내라 예약을 직접 취소할 수 없을 때
    사찰에 취소를 요청하는 용도. 마이페이지 하위 기능이라 사찰/관리자 계정은 접근 불가. */
@Controller
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class TempleInquiryController {

	private final TempleInquiryService templeInquiryService;

	@GetMapping("/mypage/temple-inquiries")
	public String list(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("inquiries", templeInquiryService.getMine(principal.getUsername()));
		return "mypage/templeInquiryList";
	}

	/** 예약 상세보기의 "사찰에 문의하기" 버튼에서 reservationId를 들고 옴 - 어떤 예약 얘기인지
	    다시 고를 필요 없이 폼에 바로 표시해둔다. */
	@GetMapping("/mypage/temple-inquiries/new")
	public String newForm(@RequestParam Long reservationId, Model model) {
		model.addAttribute("reservationId", reservationId);
		return "mypage/templeInquiryWrite";
	}

	@PostMapping("/mypage/temple-inquiries")
	public String submit(@AuthenticationPrincipal AppUserDetails principal,
						  @RequestParam Long reservationId,
						  @RequestParam String title,
						  @RequestParam String content,
						  RedirectAttributes redirectAttributes) {
		try {
			templeInquiryService.submit(principal.getUsername(), reservationId, title, content);
			redirectAttributes.addFlashAttribute("submitSuccess", true);
			return "redirect:/mypage/temple-inquiries";
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("submitError", e.getMessage());
			redirectAttributes.addAttribute("reservationId", reservationId);
			return "redirect:/mypage/temple-inquiries/new";
		}
	}

	@GetMapping("/mypage/temple-inquiries/{inquiryId}")
	public String detail(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long inquiryId, Model model) {
		TempleInquiryDto dto = templeInquiryService.getInfo(inquiryId, principal.getUsername());
		model.addAttribute("inquiry", dto);
		return "mypage/templeInquiryDetail";
	}
}
