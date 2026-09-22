package net.datasa.scit_14_3.controller.home;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
	
	@GetMapping({"","/"})
	public String home() {
		return "home/home";
	}

	@GetMapping("/templestayGuide")
	public String templestay() {
		return "templestay/templestayGuide";
	}

	@GetMapping("/findtemple")
	public String findtemple() {
		return "temple/findTemple";
	}
	
	@GetMapping("/moktak")
	public String moktak() { return "moktak/moktak"; }
}
