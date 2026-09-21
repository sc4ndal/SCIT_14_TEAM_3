package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.inquiry.TempleInquiryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

/** 사찰 계정(ROLE_TEMPLE) 전용 - 회원이 자기 사찰로 남긴 1:1 문의 목록/상세 확인 + 답변 등록.
    사이트 관리자용 admin/inquiries와는 별개(그건 회원->사이트관리자 문의). */
@Controller
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEMPLE')")
public class TempleInquiryManageController {

	private final TempleInquiryService templeInquiryService;

	@GetMapping("/temple/inquiries")
	public String list(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("inquiries", templeInquiryService.getByTemple(principal.getTempleId()));
		return "templestay/templeInquiryManageList";
	}

	@GetMapping("/temple/inquiries/{inquiryId}")
	public String detail(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long inquiryId, Model model) {
		try {
			model.addAttribute("inquiry", templeInquiryService.getInfoForTemple(inquiryId, principal.getTempleId()));
			return "templestay/templeInquiryManageDetail";
		} catch (IllegalStateException e) {
			return "redirect:/temple/inquiries";
		}
	}

	@PostMapping("/temple/inquiries/{inquiryId}/answer")
	public String answer(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long inquiryId,
						  @RequestParam String answer,
						  RedirectAttributes redirectAttributes) {
		try {
			templeInquiryService.answer(inquiryId, principal.getTempleId(), answer);
			redirectAttributes.addFlashAttribute("answerSuccess", true);
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("answerError", e.getMessage());
		}
		return "redirect:/temple/inquiries/" + inquiryId;
	}
}
