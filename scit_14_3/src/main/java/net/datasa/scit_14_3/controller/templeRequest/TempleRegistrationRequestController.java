package net.datasa.scit_14_3.controller.templeRequest;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.templeRequest.TempleRegistrationRequestDto;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.user.EmailVerificationService;
import net.datasa.scit_14_3.service.temple.TempleRegistrationRequestService;
import net.datasa.scit_14_3.service.temple.TempleStayAllowList;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** 사찰 관계자가 회원가입 없이 남기는 "사찰 등록 요청" - 누구나 접근 가능(공개).
    스팸/사칭 방지를 위해 회원가입과 동일하게 이메일 인증을 먼저 거쳐야 제출됨. */
@Controller
@RequiredArgsConstructor
@RequestMapping("/temple-requests")
public class TempleRegistrationRequestController {

	private final TempleRegistrationRequestService requestService;
	private final CloudinaryService cloudinaryService;
	private final EmailVerificationService emailVerificationService;
	private final TempleStayAllowList allowList;

	@GetMapping("/new")
	public String newForm(Model model) {
		model.addAttribute("allowedTempleNames", allowList.all());
		return "templeRequest/new";
	}

	@PostMapping
	public String submit(@ModelAttribute TempleRegistrationRequestDto dto,
						  @RequestParam(required = false) MultipartFile imageFile,
						  RedirectAttributes redirectAttributes,
						  HttpSession session) {
		// 클라이언트 값은 안 믿고 세션에 실제로 인증된 이메일인지 서버가 직접 확인함
		// (회원가입 registerLocal()과 동일한 방식)
		if (!emailVerificationService.isVerified(dto.getContactEmail(), session)) {
			redirectAttributes.addFlashAttribute("submitError", "이메일 인증을 완료해주세요.");
			return "redirect:/temple-requests/new";
		}

		try {
			// 관리자 사찰등록폼과 동일한 이유로 제출 시점에만 업로드함 - 선택 즉시 올려버리면
			// 문의를 끝까지 안 넣어도 이미지만 Cloudinary에 남는 문제가 있음.
			if (imageFile != null && !imageFile.isEmpty()) {
				dto.setImageUrl(cloudinaryService.upload(imageFile));
			}
			requestService.submit(dto);
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("submitError", e.getMessage());
			return "redirect:/temple-requests/new";
		}

		redirectAttributes.addFlashAttribute("submitSuccess", true);
		return "redirect:/";
	}
}
