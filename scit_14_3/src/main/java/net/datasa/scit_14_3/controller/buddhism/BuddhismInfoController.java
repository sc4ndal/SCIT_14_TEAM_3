package net.datasa.scit_14_3.controller.buddhism;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/*
	알아보기 > 불교 정보

	/info/intro : "불교란?"      - 7단계 로드맵 + 체크리스트 + FAQ + 다음 동선 3카드
	/info/terms : "불교 용어"     - 8개 소분류로 그룹핑한 용어 사전
	/info       : "사찰 예절 가이드" (예: /info?category=예절가이드)

	세 화면 전부 값 변경이 없는 정적 콘텐츠라 사전형식 번역(js/buddhism/*.i18n.js)을 쓴다.
 */
@Controller
@RequestMapping("/info")
public class BuddhismInfoController {

	@GetMapping({"/intro", "/intro/"})
	public String intro() {
		return "buddhism/intro";
	}

	@GetMapping({"/terms", "/terms/"})
	public String terms() {
		return "buddhism/terms";
	}

	@GetMapping({"", "/"})
	public String list(@RequestParam(required = false) String category) {
		if ("예절가이드".equals(category)) {
			return "buddhism/etiquetteGuide";
		}
		return "redirect:/";
	}
}
