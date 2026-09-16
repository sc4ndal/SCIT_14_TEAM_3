package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.templestay.ReservationParticipantService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
// @Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/reservationparticipants")
public class ReservationParticipantController {
	private final ReservationParticipantService rps;
	private final TempleStayReservationService tsrs;

	/** 본인 예약의 참가자 정보(이름/이메일/전화번호)만 조회 가능 - reservationId가 URL에 그대로
	    노출되는 값이라, 확인 없이 열어두면 아무나 남의 참가자 개인정보를 그대로 볼 수 있었다. */
	@GetMapping("/reservation/{reservationId}")
	public ResponseEntity<?> getByReservation(@PathVariable Long reservationId,
			@AuthenticationPrincipal AppUserDetails principal) {
		TempleStayReservationDTO reservation = tsrs.getInfo(reservationId);
		boolean isOwner = principal != null && reservation != null
				&& reservation.getLoginId() != null
				&& reservation.getLoginId().equals(principal.getUsername());
		if (!isOwner) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 예약만 조회할 수 있습니다."));
		}
		return ResponseEntity.ok(rps.getByReservationId(reservationId));
	}

}
