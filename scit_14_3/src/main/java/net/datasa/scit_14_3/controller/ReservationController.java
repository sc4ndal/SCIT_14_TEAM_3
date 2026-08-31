package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.PaymentDTO;
import net.datasa.scit_14_3.domain.dto.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.TempleStayReservationDTO;
import net.datasa.scit_14_3.service.PaymentService;
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
	private final PaymentService ps;
	
	@GetMapping("/reservation")
	public String Reservation() {
		return "reservation";
	}
	
	/**
	 * 템플스테이 프로그램 생성
	 * @param TempleStayReservationDTO
	 * @return
	 */
	@PostMapping("/templestayreservations")
	@ResponseBody
	public TempleStayReservationDTO TempleStayReservation(@RequestBody TempleStayReservationDTO TempleStayReservationDTO) {
		return tsrs.reserved(TempleStayReservationDTO);
	}
	
	/**
	 * 참가자 생성
	 * @param ReservationParticipantDTO
	 * @return
	 */
	@PostMapping("/reservationparticipants")
	@ResponseBody
	public List<ReservationParticipantDTO> ReservationParticipant(@RequestBody List<ReservationParticipantDTO> ReservationParticipantDTO) {
		return rps.reserved(ReservationParticipantDTO);
	}
	
	/**
	 * 결제 생성
	 * @param paymentDTO
	 * @return
	 */
	@PostMapping("/payments")
	@ResponseBody
	public PaymentDTO payment(@RequestBody PaymentDTO paymentDTO) {
		return ps.reserved(paymentDTO);
	}
}
