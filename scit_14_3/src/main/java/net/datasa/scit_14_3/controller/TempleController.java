package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.service.TempleService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/temples")
public class TempleController {
	private final TempleService ts;
	@GetMapping("/{templeId}")
	public TempleDTO getTemple(@PathVariable Long templeId) {
		return ts.getInfo(templeId);
	}
}
