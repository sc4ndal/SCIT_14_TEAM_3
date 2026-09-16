package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.TempleEventService;
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

/**
 * 찾아보기 > 불교 행사(/events) - 홈 화면 "월간 불교 행사" 캘린더와는 별개로,
 * 박람회처럼 캘린더 한 칸에 욱여넣기보다 카드로 나열해서 보여주는 게 더 어울리는
 * 사찰 행사를 위한 전용 목록 페이지.
 *
 * /events/{eventId}/favorite : 관심 행사 등록/해제 토글(JSON) - 로그인 관련 방어 방식은
 * DailyQuoteController 주석 참고, 동일한 정책을 따른다.
 */
@Controller
@RequiredArgsConstructor
public class TempleEventViewController {

	private final TempleEventService templeEventService;

	@GetMapping("/events")
	public String list(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		String loginId = principal == null ? null : principal.getUsername();
		model.addAttribute("events", templeEventService.getAllSortedByDate(loginId));
		return "temple/events";
	}

	@PostMapping("/events/{eventId}/favorite")
	@ResponseBody
	public ResponseEntity<?> toggleFavorite(@PathVariable Long eventId,
											 @AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
		}
		try {
			boolean favorited = templeEventService.toggleFavorite(principal.getUsername(), eventId);
			return ResponseEntity.ok(Map.of("favorited", favorited));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}
}
