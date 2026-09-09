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
		List<TempleDTO> temples = ts.getAll();
		// 지도 즐겨찾기 필터/별표 표시용 - 비로그인이면 favoritedIds가 빈 Set이라 전부 false로 남음
		String loginId = principal == null ? null : principal.getUsername();
		Set<Long> favoritedIds = favoriteTempleService.favoritedIds(loginId);
		temples.forEach(t -> t.setFavorited(favoritedIds.contains(t.getTempleId())));
		return temples;
	}
	
	@GetMapping("/api/templestayprograms/{programId}")
	public TempleStayProgramDTO getTempleProgram(@PathVariable Long programId) {
		return tsps.getInfo(programId);
	}
}


