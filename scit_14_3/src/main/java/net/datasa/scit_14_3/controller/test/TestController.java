package net.datasa.scit_14_3.controller.test;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@Controller
/*
		시험용 컨트롤러를 작성하는 컨트롤러
 */

public class TestController {
	
	@GetMapping("/test")
	public String test() {
		return "test/test";
	}
}
