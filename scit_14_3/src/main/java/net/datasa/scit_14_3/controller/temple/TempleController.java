package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
import net.datasa.scit_14_3.service.temple.TempleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController //이 메서드가 리턴하는 건 화면이 아니라 그냥 데이터다.
//@Controller // 프론트 화면용
@RequiredArgsConstructor
@RequestMapping("/temples")
public class TempleController {
	private final TempleService ts;
	private final FavoriteTempleService favoriteTempleService;

	@GetMapping("/{templeId}")
	public TempleDTO getTemple(@PathVariable Long templeId) {
		return ts.getInfo(templeId);
	}

	@GetMapping
	public List<TempleDTO> getTemples() {
		return ts.getAll();
	}

	/** 즐겨찾기 등록/해제 토글 - 사찰 상세보기 버튼, 지도 정보창 별표에서 씀. */
	@PostMapping("/{templeId}/favorite")
	public ResponseEntity<?> toggleFavorite(@PathVariable Long templeId,
											 @AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
		}
		boolean favorited = favoriteTempleService.toggleFavorite(principal.getUsername(), templeId);
		return ResponseEntity.ok(Map.of("favorited", favorited));
	}
}
