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

	// 용어 값 자체는 DB(BUDDHISM_INFO, category='용어')에 그대로 있지만, 이 화면은 사전 방식
	// 번역(js/buddhism/terms.i18n.js)을 써야 해서 화면에 값을 직접 고정해서 씀 - DB는 그대로
	// 두고(나중에 다시 DB 구동 방식으로 되돌릴 수도 있어서) 여기서 불러오기만 안 함.
	// BuddhismInfoService.loadTermGroups()/TermCategory/TermCardDTO/TermGroupDTO도 그대로
	// 남겨둠(되돌릴 때 다시 씀).
	@GetMapping({"/terms", "/terms/"})
	public String terms() {
		return "buddhism/terms";
	}
	
	@GetMapping({"", "/"})
	public String list(@RequestParam(required = false) String category, Model model) {
		// 예절가이드도 용어 사전(terms)과 같은 이유로 값 변경이 없는 정적 콘텐츠라
		// DB(BUDDHISM_INFO, category='예절가이드') 대신 화면에 직접 고정하고 사전형식
		// 번역(js/buddhism/etiquetteGuide.i18n.js)을 씀 - DB/서비스/시드 SQL은 그대로 두고
		// (나중에 다시 DB 구동 방식으로 되돌릴 수도 있어서) 여기서 불러오기만 안 함.
		if (BuddhismInfoService.CATEGORY_ETIQUETTE.equals(category)) {
			return "buddhism/etiquetteGuide";
		}

		model.addAttribute("category", category);
		model.addAttribute("posts", buddhismInfoService.loadPosts(category));
		return "buddhism/list";
	}
	
	
}
