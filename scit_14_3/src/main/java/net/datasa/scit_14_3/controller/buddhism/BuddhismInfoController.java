package net.datasa.scit_14_3.controller.buddhism;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.BuddhismIntroContent;
import net.datasa.scit_14_3.service.buddhism.BuddhismInfoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/*
	알아보기 > 불교 정보

	/info/intro : "불교란?"      - 7단계 로드맵 + 체크리스트 + FAQ + 다음 동선 3카드
	/info/terms : "불교 용어"     - 8개 소분류로 그룹핑한 용어 사전
	/info       : 대분류별 게시글 목록 (예: /info?category=예절가이드)
 */
@Controller
@RequestMapping("/info")
@RequiredArgsConstructor
@Slf4j
public class BuddhismInfoController {

	private final BuddhismInfoService buddhismInfoService;

	@GetMapping({"/intro", "/intro/"})
	public String intro(Model model) {
		model.addAttribute("steps", BuddhismIntroContent.STEPS);
		model.addAttribute("finalStep", BuddhismIntroContent.FINAL_STEP);
		model.addAttribute("canDo", BuddhismIntroContent.CAN_DO);
		model.addAttribute("needNot", BuddhismIntroContent.NEED_NOT);
		model.addAttribute("faqs", BuddhismIntroContent.FAQS);
		model.addAttribute("nextCards", BuddhismIntroContent.NEXT_CARDS);
		return "buddhism/intro";
	}

	@GetMapping({"/terms", "/terms/"})
	public String terms(Model model) {
		model.addAttribute("groups", buddhismInfoService.loadTermGroups());
		return "buddhism/terms";
	}

	@GetMapping({"", "/"})
	public String list(@RequestParam(required = false) String category, Model model) {
		model.addAttribute("category", category);
		model.addAttribute("posts", buddhismInfoService.loadPosts(category));
		return "buddhism/list";
	}
}
