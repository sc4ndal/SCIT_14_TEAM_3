package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.temple.TempleEventService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 찾아보기 > 불교 행사(/events) - 홈 화면 "월간 불교 행사" 캘린더와는 별개로,
 * 박람회처럼 캘린더 한 칸에 욱여넣기보다 카드로 나열해서 보여주는 게 더 어울리는
 * 사찰 행사를 위한 전용 목록 페이지.
 */
@Controller
@RequiredArgsConstructor
public class TempleEventViewController {

	private final TempleEventService templeEventService;

	@GetMapping("/events")
	public String list(Model model) {
		model.addAttribute("events", templeEventService.getAllSortedByDate());
		return "temple/events";
	}
}
