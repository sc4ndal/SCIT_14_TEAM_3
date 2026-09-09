package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.templestay.TempleStayProgramService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/** 사찰 찾아보기 지도에서 마커 클릭 -> "상세보기" 눌렀을 때 들어오는 사찰 소개 페이지. */
@Controller
@RequiredArgsConstructor
public class TempleViewController {

	private final TempleService templeService;
	private final TempleStayProgramService templeStayProgramService;
	private final FavoriteTempleService favoriteTempleService;

	@GetMapping("/temple-detail/{templeId}")
	public String detail(@PathVariable Long templeId, Model model,
						  @AuthenticationPrincipal AppUserDetails principal) {
		model.addAttribute("temple", templeService.getInfo(templeId));
		model.addAttribute("programs", templeStayProgramService.getByTemple(templeId));
		String loginId = principal == null ? null : principal.getUsername();
		model.addAttribute("favorited", favoriteTempleService.isFavoriteTemple(loginId, templeId));
		return "temple/templeDetail";
	}
}
