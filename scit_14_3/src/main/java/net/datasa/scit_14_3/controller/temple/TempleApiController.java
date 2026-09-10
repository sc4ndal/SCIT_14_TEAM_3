package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.temple.FavoriteTempleService;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.templestay.TempleStayProgramService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class TempleApiController {
	private final TempleService ts;
	private final TempleStayProgramService tsps;
	private final FavoriteTempleService favoriteTempleService;

	@GetMapping("/api/temples")
	public List<TempleDTO> getTemple(@AuthenticationPrincipal AppUserDetails principal) {
		// ts.getAll()은 캐싱된 목록(TempleService 참고)이라 그 안의 DTO를 직접 고치면(setFavorited)
		// 캐시 자체가 오염돼서 다음 사람이 조회할 때도 방금 로그인한 사람의 즐겨찾기 상태가 그대로
		// 남아있게 된다 - toBuilder()로 각 요청마다 새 사본을 만들어서 그 사본에만 값을 채운다.
		String loginId = principal == null ? null : principal.getUsername();
		Set<Long> favoritedIds = favoriteTempleService.favoritedIds(loginId);
		return ts.getAll().stream()
				.map(t -> t.toBuilder().favorited(favoritedIds.contains(t.getTempleId())).build())
				.toList();
	}
	
	@GetMapping("/api/templestayprograms/{programId}")
	public TempleStayProgramDTO getTempleProgram(@PathVariable Long programId) {
		return tsps.getInfo(programId);
	}
}


