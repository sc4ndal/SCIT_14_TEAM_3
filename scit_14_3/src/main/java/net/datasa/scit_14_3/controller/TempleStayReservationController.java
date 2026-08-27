package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleStayReservationDTO;
import net.datasa.scit_14_3.service.TempleStayReservationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
//@Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/templestayreservations")
public class TempleStayReservationController {
		private final TempleStayReservationService tsrs;
		
		@GetMapping("/{reservationId}")
		public TempleStayReservationDTO getTempleStayReservation(@PathVariable Long reservationId) {
			return tsrs.getInfo(reservationId);
		}
}
