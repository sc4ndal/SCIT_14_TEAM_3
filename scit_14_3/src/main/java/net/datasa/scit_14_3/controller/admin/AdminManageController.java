package net.datasa.scit_14_3.controller.admin;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.user.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 사이트 관리자 전용 - 회원관리(USER)/사찰관리(TEMPLE) 두 탭으로 나뉜 관리 화면.
 * 사찰관리에는 이미 등록 완료된(TEMPLE 테이블에 실제로 존재하는) 사찰만 나옴 - 대기중인
 * 요청은 AdminTempleRequestController가 다루는 "사찰 등록 요청 목록"에서 따로 봄.
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/manage")
public class AdminManageController {

	private final UserService userService;
	private final TempleService templeService;
	private final CloudinaryService cloudinaryService;

	@GetMapping
	public String manage(@RequestParam(defaultValue = "user") String tab, Model model) {
		model.addAttribute("tab", tab);
		if ("temple".equals(tab)) {
			model.addAttribute("temples", templeService.getAllForAdmin());
		} else {
			model.addAttribute("users", userService.getAllRegularUsers());
		}
		return "admin/manage";
	}

	// ================= 회원관리 =================

	@GetMapping("/user/{loginId}/edit")
	public String editUserForm(@PathVariable String loginId, Model model) {
		model.addAttribute("target", userService.findByLoginId(loginId)
				.orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("해당 회원을 찾을 수 없습니다.")));
		return "admin/userEditForm";
	}

	@PostMapping("/user/{loginId}")
	public String updateUser(@PathVariable String loginId,
							  @RequestParam String nickname,
							  @RequestParam String name,
							  @RequestParam(required = false) String phone,
							  @RequestParam String email,
							  @RequestParam UserEntity.Role role,
							  RedirectAttributes redirectAttributes) {
		try {
			userService.updateAdmin(loginId, nickname, name, phone, email, role);
			redirectAttributes.addFlashAttribute("manageSuccess", "회원 정보가 수정되었습니다.");
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("manageError", e.getMessage());
			return "redirect:/admin/manage/user/" + loginId + "/edit";
		}
		return "redirect:/admin/manage?tab=user";
	}

	@PostMapping("/user/{loginId}/delete")
	public String deleteUser(@PathVariable String loginId, RedirectAttributes redirectAttributes) {
		try {
			userService.delete(loginId);
			redirectAttributes.addFlashAttribute("manageSuccess", "회원이 삭제되었습니다.");
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("manageError", e.getMessage());
		}
		return "redirect:/admin/manage?tab=user";
	}

	// ================= 사찰관리 =================

	@GetMapping("/temple/{templeId}/edit")
	public String editTempleForm(@PathVariable Long templeId, Model model) {
		model.addAttribute("formData", templeService.getInfoForAdmin(templeId));
		model.addAttribute("editMode", true);
		return "admin/templeForm";
	}

	@PostMapping("/temple/{templeId}")
	public String updateTemple(@PathVariable Long templeId,
								@ModelAttribute TempleDTO dto,
								@RequestParam(required = false) MultipartFile imageFile,
								RedirectAttributes redirectAttributes) {
		if (imageFile != null && !imageFile.isEmpty()) {
			dto.setImageUrl(cloudinaryService.upload(imageFile));
		}
		templeService.updateAdmin(templeId, dto);
		redirectAttributes.addFlashAttribute("manageSuccess", "사찰 정보가 수정되었습니다.");
		return "redirect:/admin/manage?tab=temple";
	}

	@PostMapping("/temple/{templeId}/delete")
	public String deleteTemple(@PathVariable Long templeId, RedirectAttributes redirectAttributes) {
		try {
			templeService.delete(templeId);
			redirectAttributes.addFlashAttribute("manageSuccess", "사찰 등록이 취소(삭제)되었습니다.");
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("manageError", e.getMessage());
		}
		return "redirect:/admin/manage?tab=temple";
	}
}
