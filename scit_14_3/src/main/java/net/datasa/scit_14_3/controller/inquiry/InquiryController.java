package net.datasa.scit_14_3.controller.inquiry;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.inquiry.InquiryDto;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.inquiry.InquiryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** 일반회원이 사이트 관리자에게 남기는 1:1 문의 - 마이페이지 하위 기능이라 사찰/관리자 계정은 접근 불가. */
@Controller
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class InquiryController {

	private final InquiryService inquiryService;

	@GetMapping("/mypage/inquiries")
	public String list(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("inquiries", inquiryService.getMine(principal.getUsername()));
		return "mypage/inquiryList";
	}

	@GetMapping("/mypage/inquiries/new")
	public String newForm() {
		return "mypage/inquiryWrite";
	}

	@PostMapping("/mypage/inquiries")
	public String submit(@AuthenticationPrincipal AppUserDetails principal,
						  @RequestParam String title,
						  @RequestParam String content,
						  RedirectAttributes redirectAttributes) {
		inquiryService.submit(principal.getUsername(), title, content);
		redirectAttributes.addFlashAttribute("submitSuccess", true);
		return "redirect:/mypage/inquiries";
	}

	@GetMapping("/mypage/inquiries/{inquiryId}")
	public String detail(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long inquiryId, Model model) {
		InquiryDto dto = inquiryService.getInfo(inquiryId, principal.getUsername());
		model.addAttribute("inquiry", dto);
		return "mypage/inquiryDetail";
	}
}
