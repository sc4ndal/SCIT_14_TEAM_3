package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Slf4j
@Controller
@RequiredArgsConstructor
public class reservationController {
	@GetMapping("/reservation")
	public String reservation() {
		return "reservation";
	}
}
