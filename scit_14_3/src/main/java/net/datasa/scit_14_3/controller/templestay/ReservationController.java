package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.domain.dto.templestay.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.service.payment.PaymentService;
import net.datasa.scit_14_3.service.templestay.ReservationParticipantService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ReservationController {
	private final TempleStayReservationService tsrs;
	private final ReservationParticipantService rps;
	private final PaymentService ps;
	
	@GetMapping("/reservation")
	public String Reservation() {
		return "templestay/reservation";
	}
	
	/**
	 * 템플스테이 프로그램 생성
	 * @param TempleStayReservationDTO
	 * @return
	 */
	@PostMapping("/templestayreservations")
	@ResponseBody
	public ResponseEntity<?> TempleStayReservation(@RequestBody TempleStayReservationDTO TempleStayReservationDTO) {
		try {
			return ResponseEntity.ok(tsrs.reserved(TempleStayReservationDTO));
		} catch (IllegalStateException e) {
			// 정원 초과 등 - 프론트에서 메시지 그대로 alert로 띄움(reservation.js 참고)
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		}
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
	
	@GetMapping("/templestayreservations")
	@ResponseBody
	public List<TempleStayReservationDTO> getTempleStayReservation(@RequestParam String loginId) {
		return tsrs.findByMyReservation(loginId);
	}

	@GetMapping("/templestayreservations/{reservationId}")
	@ResponseBody
	public TempleStayReservationDTO getTempleStayReservationById(@PathVariable Long reservationId) {
		return tsrs.getInfo(reservationId);
	}
	
	@GetMapping("/payments/reservation/{reservationId}")
	@ResponseBody
	public PaymentDTO getPaymentByReservations(@PathVariable Long reservationId) {
		return ps.findByReservationId(reservationId);
	}
	
	@PatchMapping("/templestayreservations/{reservationId}/cancel")
	@ResponseBody
	public ResponseEntity<?> canceledReservation(@PathVariable Long reservationId) {
		try {
			return ResponseEntity.ok(tsrs.canceledMyReservation(reservationId));
		} catch (IllegalStateException e) {
			// 체크인 24시간 전 취소 마감 등 - 프론트에서 메시지 그대로 alert로 띄움
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		}
	}
}
