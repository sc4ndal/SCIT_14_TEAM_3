package net.datasa.scit_14_3.controller.temple;

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
	@GetMapping("/maptemplestayviews/{programId}")
	public String getMapTempleStayView(@PathVariable Long programId, Model model) {
		model.addAttribute("programId", programId);
		return "templestay/mapTempleStayView";
	}

	@GetMapping("/maptemplestayfavorites")
	public String getMapTempleStayFavorite() {
		return "templestay/mapTempleStayFavorite";
	}
}
