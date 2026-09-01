package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MapTempleController {
	// 사찰 목록 화면은 mapTempleList.html -> findTemple.html로 옮겨가면서 /findtemple이 담당하게 됐다.
	// 예전 주소로 들어오는 링크가 깨지지 않도록 리다이렉트만 남긴다.
	@GetMapping("/maptemples")
	public String getMapTemple() {
		return "redirect:/findtemple";
	}
	@GetMapping("/maptemplestayviews/{programId}")
	public String getMapTempleStayView(@PathVariable Long programId, Model model) {
		model.addAttribute("programId", programId);
		return "mapTempleStayView";
	}
	
	@GetMapping("/maptemplestayfavorites")
	public String getMapTempleStayFavorite() {
		return "mapTempleStayFavorite";
	}
}
