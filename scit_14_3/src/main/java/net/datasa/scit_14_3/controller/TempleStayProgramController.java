package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.domain.dto.TempleStayProgramDTO;
import net.datasa.scit_14_3.service.TempleService;
import net.datasa.scit_14_3.service.TempleStayProgramService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController //이 메서드가 리턴하는 건 화면이 아니라 그냥 데이터다.
//@Controller // 프론트 화면용
@RequiredArgsConstructor
@RequestMapping("/templestayprograms")
public class TempleStayProgramController {
	private final TempleStayProgramService tsps;
	@GetMapping("/{programId}")
	public TempleStayProgramDTO getTemple(@PathVariable Long programId) {
		return tsps.getInfo(programId);
	}
}
