package net.datasa.scit_14_3.controller.etiquette;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class EtiquetteSimulationController {
	
	@GetMapping("/etiquette-simulation")
	public String etiquetteSimulation() {
		return "etiquette/EtiquetteSimulation";
	}

}
