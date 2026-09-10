package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleEventDTO;
import net.datasa.scit_14_3.service.temple.TempleEventService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/*
	홈 화면 "월간 불교 행사" 캘린더(home.js loadCalendarEvents)가 불러다 쓰는 사찰 행사 목록 API.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/templeevents")
public class TempleEventController {

	private final TempleEventService templeEventService;

	@GetMapping
	public List<TempleEventDTO> getTempleEvents() {
		return templeEventService.getAll();
	}
}
