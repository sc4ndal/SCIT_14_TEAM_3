package net.datasa.scit_14_3.controller.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.service.temple.TempleService;
import net.datasa.scit_14_3.service.templestay.TempleStayProgramService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TempleApiController {
	private final TempleService ts;
	private final TempleStayProgramService tsps;
	
	@GetMapping("/api/temples")
	public List<TempleDTO> getTemple() {
		return ts.getAll();
	}
	
	@GetMapping("/api/templestayprograms/{programId}")
	public TempleStayProgramDTO getTempleProgram(@PathVariable Long programId) {
		return tsps.getInfo(programId);
	}
}


