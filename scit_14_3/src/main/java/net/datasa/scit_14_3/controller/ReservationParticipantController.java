package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.ReservationParticipantDTO;
import net.datasa.scit_14_3.service.ReservationParticipantService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
// @Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/reservationparticipants")
public class ReservationParticipantController {
	private final ReservationParticipantService rps;
	
	@GetMapping("/{participantId}")
	public ReservationParticipantDTO getReservationParticipant(@PathVariable Long participantId) {
		return rps.getInfo(participantId);
	}
}
