package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.TempleStayReservationDTO;
import net.datasa.scit_14_3.service.ReservationParticipantService;
import net.datasa.scit_14_3.service.TempleStayReservationService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ReservationController {
	private final TempleStayReservationService tsrs;
	private final ReservationParticipantService rps;
	
	@GetMapping("/reservation")
	public String Reservation() {
		return "reservation";
	}
	@PostMapping("/templestayreservations")
	@ResponseBody
	public TempleStayReservationDTO TempleStayReservation(@RequestBody TempleStayReservationDTO TempleStayReservationDTO) {
		return tsrs.reserved(TempleStayReservationDTO);
	}
	
	@PostMapping("/reservationparticipants")
	@ResponseBody
	public List<ReservationParticipantDTO> ReservationParticipant(@RequestBody List<ReservationParticipantDTO> ReservationParticipantDTO) {
		return rps.reserved(ReservationParticipantDTO);
	}
}
