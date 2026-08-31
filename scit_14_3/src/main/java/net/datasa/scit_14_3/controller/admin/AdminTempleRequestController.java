package net.datasa.scit_14_3.controller.admin;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.domain.dto.TempleRegistrationRequestDto;
import net.datasa.scit_14_3.service.CloudinaryService;
import net.datasa.scit_14_3.service.EmailVerificationService;
import net.datasa.scit_14_3.service.TempleRegistrationRequestService;
import net.datasa.scit_14_3.service.TempleService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * 관리자 전용 - 사찰 등록 요청 목록/상세 확인 + 승인 처리(실제 TEMPLE 생성 + 계정정보 이메일 발송).
 * 라우팅 자체는 WebSecurityConfig의 "/admin/**" -> hasRole("ADMIN") 규칙으로 이미 막혀있음.
 */
@Controller
@RequiredArgsConstructor
public class AdminTempleRequestController {

	private final TempleRegistrationRequestService requestService;
	private final TempleService templeService;
	private final EmailVerificationService emailVerificationService;
	private final CloudinaryService cloudinaryService;

	private static final String ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	@GetMapping("/admin/temple-requests")
	public String list(Model model) {
		model.addAttribute("requests", requestService.getAll());
		return "admin/templeRequestList";
	}

	@GetMapping("/admin/temple-requests/{requestId}")
	public String detail(@PathVariable Long requestId, Model model) {
		model.addAttribute("request", requestService.getInfo(requestId));
		return "admin/templeRequestDetail";
	}

	@GetMapping("/admin/temples/new")
	public String newTempleForm(@RequestParam(required = false) Long fromRequest, Model model) {
		if (fromRequest != null) {
			model.addAttribute("prefill", requestService.getInfo(fromRequest));
			model.addAttribute("fromRequest", fromRequest);
		}
		return "admin/templeForm";
	}

	@PostMapping("/admin/temples")
	public String createTemple(@ModelAttribute TempleDTO dto,
								@RequestParam(required = false) MultipartFile imageFile,
								@RequestParam(required = false) Long fromRequest,
								RedirectAttributes redirectAttributes) {
		// 파일을 새로 골랐을 때만 여기서 Cloudinary에 올림 - 폼 작성 중간에 선택 즉시 올려버리면
		// 등록을 취소해도 이미지만 Cloudinary에 남는 문제가 있어서, 실제 등록이 확정되는
		// 이 시점(제출)에만 업로드함. 안 고르면 hidden imageUrl(요청에 있던 기존 값)을 그대로 씀.
		if (imageFile != null && !imageFile.isEmpty()) {
			dto.setImageUrl(cloudinaryService.upload(imageFile));
		}

		String loginId = randomLoginId();
		String rawPassword = randomPassword();

		TempleDTO saved = templeService.register(dto, loginId, rawPassword);

		if (fromRequest != null) {
			TempleRegistrationRequestDto request = requestService.getInfo(fromRequest);
			emailVerificationService.sendTempleCredentials(request.getContactEmail(), loginId, rawPassword);
			requestService.markApproved(fromRequest, saved.getTempleId());
		}

		redirectAttributes.addFlashAttribute("createSuccess", true);
		return "redirect:/admin/temple-requests";
	}

	private String randomLoginId() {
		String candidate;
		do {
			StringBuilder sb = new StringBuilder("@");
			for (int i = 0; i < 10; i++) {
				sb.append(ID_CHARS.charAt(RANDOM.nextInt(ID_CHARS.length())));
			}
			candidate = sb.toString();
		} while (!templeService.isLoginIdAvailable(candidate));
		return candidate;
	}

	private String randomPassword() {
		return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}
}
