package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import net.datasa.scit_14_3.service.templestay.TempleStayProgramService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 사찰 계정(ROLE_TEMPLE) 자신이 등록한 템플스테이 프로그램을 등록/조회하는 화면.
 * 사이트 관리자(ROLE_ADMIN)용 admin/** 와는 별개 - 각자 자기 사찰 소속 프로그램만 다룸.
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/temple/programs")
@PreAuthorize("hasRole('TEMPLE')")
public class TempleProgramManageController {

	private final TempleStayProgramService templeStayProgramService;
	private final CloudinaryService cloudinaryService;

	@GetMapping
	public String list(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		model.addAttribute("programs", templeStayProgramService.getByTemple(principal.getTempleId()));
		return "templestay/templeProgramList";
	}

	@GetMapping("/new")
	public String newForm(Model model) {
		model.addAttribute("formData", TempleStayProgramDTO.builder().build());
		model.addAttribute("editMode", false);
		return "templestay/templeProgramForm";
	}

	@PostMapping
	public String register(@AuthenticationPrincipal AppUserDetails principal,
							@ModelAttribute("formData") TempleStayProgramDTO formData,
							@RequestParam(required = false) MultipartFile imageFile,
							Model model,
							RedirectAttributes redirectAttributes) {
		if (imageFile != null && !imageFile.isEmpty()) {
			formData.setImageUrl(cloudinaryService.upload(imageFile));
		}
		try {
			templeStayProgramService.register(formData, principal.getTempleId());
			redirectAttributes.addFlashAttribute("manageSuccess", "프로그램이 등록되었습니다.");
			return "redirect:/temple/programs";
		} catch (IllegalStateException e) {
			model.addAttribute("formError", e.getMessage());
			model.addAttribute("editMode", false);
			return "templestay/templeProgramForm";
		}
	}

	@GetMapping("/{programId}/edit")
	public String editForm(@AuthenticationPrincipal AppUserDetails principal,
							@PathVariable Long programId, Model model) {
		model.addAttribute("formData", templeStayProgramService.getForOwner(programId, principal.getTempleId()));
		model.addAttribute("editMode", true);
		return "templestay/templeProgramForm";
	}

	@PostMapping("/{programId}")
	public String update(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long programId,
						  @ModelAttribute("formData") TempleStayProgramDTO formData,
						  @RequestParam(required = false) MultipartFile imageFile,
						  @RequestParam(required = false) String existingImageUrl,
						  Model model,
						  RedirectAttributes redirectAttributes) {
		formData.setImageUrl(imageFile != null && !imageFile.isEmpty() ? cloudinaryService.upload(imageFile) : existingImageUrl);
		try {
			templeStayProgramService.update(programId, formData, principal.getTempleId());
			redirectAttributes.addFlashAttribute("manageSuccess", "프로그램이 수정되었습니다.");
			return "redirect:/temple/programs";
		} catch (IllegalStateException e) {
			model.addAttribute("formError", e.getMessage());
			model.addAttribute("editMode", true);
			formData.setProgramId(programId);
			return "templestay/templeProgramForm";
		}
	}

	@PostMapping("/{programId}/delete")
	public String delete(@AuthenticationPrincipal AppUserDetails principal,
						  @PathVariable Long programId,
						  RedirectAttributes redirectAttributes) {
		try {
			templeStayProgramService.delete(programId, principal.getTempleId());
			redirectAttributes.addFlashAttribute("manageSuccess", "프로그램이 삭제되었습니다.");
		} catch (IllegalStateException e) {
			redirectAttributes.addFlashAttribute("manageError", e.getMessage());
		}
		return "redirect:/temple/programs";
	}
}
