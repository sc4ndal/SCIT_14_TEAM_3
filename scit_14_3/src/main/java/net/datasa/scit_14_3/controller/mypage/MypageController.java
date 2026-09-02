package net.datasa.scit_14_3.controller.mypage;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.temple.TempleService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 마이페이지 - 사찰 계정(사찰정보수정)은 비밀번호 변경 + 대표이미지/영어지원여부/환불규정/유의사항을
 * 다룸. 일반회원(USER) 정보수정은 아직 없음 - 요청 들어오면 그때 추가.
 */
@Controller
@RequiredArgsConstructor
public class MypageController {

	private final TempleService templeService;
	private final CloudinaryService cloudinaryService;

	@GetMapping("/mypage/edit")
	public String edit(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		boolean isTempleAccount = principal.isTempleAccount();
		model.addAttribute("isTempleAccount", isTempleAccount);
		if (isTempleAccount) {
			model.addAttribute("formData", templeService.getInfo(principal.getTempleId()));
		}
		return "mypage/edit";
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
}
