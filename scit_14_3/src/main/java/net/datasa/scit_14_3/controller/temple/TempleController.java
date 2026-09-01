package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.service.temple.TempleService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController //이 메서드가 리턴하는 건 화면이 아니라 그냥 데이터다.
//@Controller // 프론트 화면용
@RequiredArgsConstructor
@RequestMapping("/temples")
public class TempleController {
	private final TempleService ts;
	@GetMapping("/{templeId}")
	public TempleDTO getTemple(@PathVariable Long templeId) {
		return ts.getInfo(templeId);
	}
	
	@GetMapping
	public List<TempleDTO> getTemples() {
		return ts.getAll();
	}
}
