package net.datasa.scit_14_3.controller.buddhism;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.buddhism.TempleFoodService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

/*
	알아보기 > 불교 정보 > 사찰 음식

	/info/food                    : 사찰음식 추천 목록 화면
	/info/food/{id}/favorite      : 즐겨찾기 등록/해제 토글(JSON)

	로그인 관련 방어 방식은 DailyQuoteController 주석 참고 - 동일한 정책을 따른다.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class TempleFoodController {

	private final TempleFoodService templeFoodService;

	@GetMapping("/info/food")
	public String food(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		String loginId = principal == null ? null : principal.getUsername();
		model.addAttribute("foods", templeFoodService.getAllFoods(loginId));
		return "buddhism/food";
	}

	@PostMapping("/info/food/{recommendationId}/favorite")
	@ResponseBody
	public ResponseEntity<?> toggleFavorite(@PathVariable Long recommendationId,
											 @AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
		}
		try {
			boolean favorited = templeFoodService.toggleFavorite(principal.getUsername(), recommendationId);
			return ResponseEntity.ok(Map.of("favorited", favorited));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}
}
