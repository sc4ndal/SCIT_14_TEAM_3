package net.datasa.scit_14_3.controller.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.payment.PaymentService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
	public ResponseEntity<?> readyToss(@RequestBody Map<String, Object> body,
			@AuthenticationPrincipal AppUserDetails principal) {
		// /payments/** 는 PUBLIC_URLS에 열려 있어서 로그인 여부와 예약 소유자를 여기서 직접 확인한다.
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
		}
		try {
			Long reservationId = Long.valueOf(String.valueOf(body.get("reservationId")));
			if (!reservationService.isOwner(reservationId, principal.getUsername())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 예약만 결제할 수 있습니다."));
			}
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
											 @RequestParam int amount,
											 @AuthenticationPrincipal AppUserDetails principal) {
		// 결제를 시작한 브라우저(같은 로그인 세션)로 돌아오는 요청이라 본인 예약인지 확인할 수 있다.
		// 본인이 아니거나 세션이 끊겼으면 승인 처리 없이 실패 화면으로 보낸다(승인 전이라 결제된 돈은 없다).
		if (principal == null || !reservationService.isOwner(reservationId, principal.getUsername())) {
			return ResponseEntity.status(HttpStatus.FOUND)
					.header("Location", "/reservation?paid=fail&reservationId=" + reservationId).build();
		}
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
	public ResponseEntity<Void> failToss(@RequestParam Long reservationId,
			@AuthenticationPrincipal AppUserDetails principal) {
		// 본인 예약일 때만 자리를 비운다(다른 사람의 예약 번호를 넣어 취소시키지 못하게).
		if (principal != null && reservationService.isOwner(reservationId, principal.getUsername())) {
			reservationService.cancelUnpaid(reservationId);
		}
		return ResponseEntity.status(HttpStatus.FOUND)
				.header("Location", "/reservation?paid=fail&reservationId=" + reservationId).build();
	}
}
