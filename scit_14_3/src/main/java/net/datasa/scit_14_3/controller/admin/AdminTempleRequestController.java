package net.datasa.scit_14_3.controller.admin;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templeRequest.TempleRegistrationRequestDto;
import net.datasa.scit_14_3.service.user.EmailVerificationService;
import net.datasa.scit_14_3.service.temple.TempleRegistrationRequestService;
import net.datasa.scit_14_3.service.temple.TempleService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
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

	private static final String ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	@GetMapping("/admin/temple-requests")
	public String list(Model model) {
		model.addAttribute("requests", requestService.getPending());
		return "admin/templeRequestList";
	}

	@GetMapping("/admin/temple-requests/{requestId}")
	public String detail(@PathVariable Long requestId, Model model) {
		model.addAttribute("request", requestService.getInfo(requestId));
		return "admin/templeRequestDetail";
	}

	/** 상세보기의 "등록" 버튼 - 요청 내용 그대로 바로 사찰 생성 + 계정정보 이메일 발송까지 한 번에 처리. */
	@PostMapping("/admin/temple-requests/{requestId}/approve")
	public String approve(@PathVariable Long requestId, RedirectAttributes redirectAttributes) {
		TempleRegistrationRequestDto request = requestService.getInfo(requestId);

		TempleDTO dto = TempleDTO.builder()
				.name(request.getName())
				.imageUrl(request.getImageUrl())
				.address(request.getAddress())
				.latitude(request.getLatitude())
				.longitude(request.getLongitude())
				.region(request.getRegion())
				.supportSea(request.isSupportSea())
				.supportMountain(request.isSupportMountain())
				.supportRiver(request.isSupportRiver())
				.supportUrban(request.isSupportUrban())
				.supportEnglish(request.isSupportEnglish())
				.specialNotice(request.getSpecialNotice())
				.refundPolicy(request.getRefundPolicy())
				.build();

		String loginId = randomLoginId();
		String rawPassword = randomPassword();
		TempleDTO saved = templeService.register(dto, loginId, rawPassword);

		emailVerificationService.sendTempleCredentials(request.getContactEmail(), loginId, rawPassword);
		requestService.markApproved(requestId, saved.getTempleId());

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
