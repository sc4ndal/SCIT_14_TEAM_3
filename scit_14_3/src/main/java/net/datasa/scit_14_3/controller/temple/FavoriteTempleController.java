package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favoritetemples")
public class FavoriteTempleController {
	private final FavoriteTempleService fts;
	// 즐겨찾기 토글(별표 클릭했을 때 호출)
	@PreAuthorize("hasRole('USER')")
	@PostMapping("/{templeId}/toggle")
	public Map<String, Object> toggle(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long templeId) {
		boolean favorite = fts.toggleFavoriteTemple(user.getUsername(), templeId);
		
		Map<String, Object> result = new HashMap<>();
		result.put("favorite", favorite);
		return result;
	}
	
	// 지금 이 사찰이 즐겨찾기 상태인지 확인(정보창 열 때 별표 초기 모양 결정용) - 지도에 마커 찍을 때마다
	// 호출되는 조회성 API라 로그인 필수로 막으면 비로그인 방문자는 마커마다 로그인페이지로 튕겨서
	// JSON 파싱 에러가 남. 조회는 누구나 가능하게 열어두고, 비로그인이면 그냥 false로 응답한다.
	@PreAuthorize("hasRole('USER')")
	@GetMapping("/{templeId}")
	public Map<String, Object> isFavorite(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long templeId) {
		boolean favorite = user != null && fts.isFavoriteTemple(user.getUsername(), templeId);

		Map<String, Object> result = new HashMap<>();
		result.put("favorite", favorite);
		return result;
	}

	// 로그인한 사람이 즐겨찾기한 사찰 id 목록 전체 (필터용) - 위와 같은 이유로 조회 자체는 공개,
	// 비로그인이면 빈 목록 반환.
	@PreAuthorize("hasRole('USER')")
	@GetMapping
	public List<Long> getMyFavoriteTempleIds(@AuthenticationPrincipal AppUserDetails user) {
		if (user == null) {
			return List.of();
		}
		return fts.getMyFavoriteTemple(user.getUsername())
				.stream()
				.map(favorite -> favorite.getTemple().getTempleId())
				.collect(Collectors.toList());
	}
}
