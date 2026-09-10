package net.datasa.scit_14_3.controller.admin;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.inquiry.InquiryService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 관리자 전용 - 문의 목록/상세 확인 + 답변 등록.
 * 라우팅 자체는 WebSecurityConfig의 "/admin/**" -> hasRole("ADMIN") 규칙으로 이미 막혀있음.
 */
@Controller
@RequiredArgsConstructor
public class AdminInquiryController {

	private final InquiryService inquiryService;

	@GetMapping("/admin/inquiries")
	public String list(Model model) {
		model.addAttribute("inquiries", inquiryService.getAll());
		return "admin/inquiryList";
	}

	@GetMapping("/admin/inquiries/{inquiryId}")
	public String detail(@PathVariable Long inquiryId, Model model) {
		model.addAttribute("inquiry", inquiryService.getInfo(inquiryId));
		return "admin/inquiryDetail";
	}

	@PostMapping("/admin/inquiries/{inquiryId}/answer")
	public String answer(@PathVariable Long inquiryId,
						  @RequestParam String answer,
						  RedirectAttributes redirectAttributes) {
		inquiryService.answer(inquiryId, answer);
		redirectAttributes.addFlashAttribute("answerSuccess", true);
		return "redirect:/admin/inquiries/" + inquiryId;
	}
}
