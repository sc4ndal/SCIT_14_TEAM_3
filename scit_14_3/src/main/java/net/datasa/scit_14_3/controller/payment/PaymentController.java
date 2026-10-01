package net.datasa.scit_14_3.controller.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.service.payment.PaymentService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentController {
	private final PaymentService ps;
	private final TempleStayReservationService reservationService;

	/** 토스페이 결제 준비 - 결제 행을 대기 상태로 만들어두고 결제위젯에 넘길 orderId를 돌려준다.
	    실제 결제창은 프론트(reservation.js)가 토스 SDK로 직접 연다. */
	@PostMapping("/toss/ready")
	public ResponseEntity<?> readyToss(@RequestBody Map<String, Object> body) {
		try {
			Long reservationId = Long.valueOf(String.valueOf(body.get("reservationId")));
			int amount = Integer.parseInt(String.valueOf(body.get("amount")));
			String orderId = ps.readyTossPayment(reservationId, amount);
			return ResponseEntity.ok(Map.of("orderId", orderId));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		} catch (Exception e) {
			log.warn("토스페이 ready 실패", e);
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
					.body(Map.of("message", e.getClass().getSimpleName() + ": " + e.getMessage()));
		}
	}

	/** 토스페이 결제 완료 후 돌아오는 콜백(GET, paymentKey/orderId/amount 쿼리파라미터 포함) -
	    승인 처리 후 예약 페이지로 리다이렉트. */
	@GetMapping("/toss/success")
	public ResponseEntity<Void> successToss(@RequestParam Long reservationId,
											 @RequestParam String paymentKey,
											 @RequestParam int amount) {
		String redirect;
		try {
			ps.confirmTossPayment(reservationId, paymentKey, amount);
			redirect = "/reservation?paid=success&reservationId=" + reservationId;
		} catch (Exception e) {
			log.warn("토스페이 승인 처리 실패 reservationId={}", reservationId, e);
			redirect = "/reservation?paid=fail&reservationId=" + reservationId;
		}
		return ResponseEntity.status(HttpStatus.FOUND).header("Location", redirect).build();
	}

	/** 토스페이 쪽에서 결제 자체가 실패/취소된 경우 - 예약을 취소해서 자리를 비운다. */
	@GetMapping("/toss/fail")
	public ResponseEntity<Void> failToss(@RequestParam Long reservationId) {
		reservationService.cancelUnpaid(reservationId);
		return ResponseEntity.status(HttpStatus.FOUND)
				.header("Location", "/reservation?paid=fail&reservationId=" + reservationId).build();
	}
}
