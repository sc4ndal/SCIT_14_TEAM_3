package net.datasa.scit_14_3.controller.buddhism;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.buddhism.DailyQuoteService;
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
	알아보기 > 불교 정보 > 오늘의 불교 한마디

	/info/quote         : 오늘의 한마디 화면 - 전체 한마디 목록도 같이 내려줘서(allQuotes),
	                       "다른 한마디 보기"를 눌러도 서버 왕복 없이 클라이언트에서 바로 바꾼다
	                       (Aiven처럼 원격 DB일 때 클릭마다 왕복하면 체감 지연이 커서 바꿈).
	/info/quote/{id}/favorite : 즐겨찾기 등록/해제 토글(JSON)

	즐겨찾기는 로그인이 필요하지만 /info/**는 전체 공개 경로라(WebSecurityConfig 참고)
	서버가 URL 단위로 막지는 않는다 - 다른 로그인 필요 액션들(reservation.js 등)과 동일하게,
	화면에서 auth-info로 로그인 여부를 먼저 확인하고, 컨트롤러에서도 principal이 없으면
	401을 내려 이중으로 방어한다.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class DailyQuoteController {

	private final DailyQuoteService dailyQuoteService;

	@GetMapping("/info/quote")
	public String quote(@AuthenticationPrincipal AppUserDetails principal, Model model) {
		String loginId = loginIdOf(principal);
		model.addAttribute("quote", dailyQuoteService.getQuoteOfTheDay(loginId));
		model.addAttribute("allQuotes", dailyQuoteService.getAllQuotes(loginId));
		return "buddhism/quote";
	}

	@PostMapping("/info/quote/{quoteId}/favorite")
	@ResponseBody
	public ResponseEntity<?> toggleFavorite(@PathVariable Long quoteId,
											 @AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
		}
		try {
			boolean favorited = dailyQuoteService.toggleFavorite(principal.getUsername(), quoteId);
			return ResponseEntity.ok(Map.of("favorited", favorited));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}

	private String loginIdOf(AppUserDetails principal) {
		return principal == null ? null : principal.getUsername();
	}
}
