package net.datasa.scit_14_3.controller.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.service.payment.PaymentService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
// @Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentController {
	private final PaymentService ps;
	private final TempleStayReservationService reservationService;

	@GetMapping("/{paymentId}")
	public PaymentDTO getPayment(@PathVariable("paymentId") Long paymentId) {
		return ps.getInfo(paymentId);
	}

	/** 결제 준비 - 성공하면 사용자를 보낼 카카오페이 결제 페이지 URL을 돌려준다(프론트에서 그 URL로 이동). */
	@PostMapping("/kakao/ready")
	public ResponseEntity<?> readyKakao(@RequestBody Map<String, Object> body) {
		try {
			Long reservationId = Long.valueOf(String.valueOf(body.get("reservationId")));
			int amount = Integer.parseInt(String.valueOf(body.get("amount")));
			String itemName = String.valueOf(body.get("itemName"));
			String redirectUrl = ps.readyKakaoPayment(reservationId, amount, itemName);
			return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		} catch (org.springframework.web.client.HttpStatusCodeException e) {
			// 카카오 쪽 에러 응답(잘못된 cid/시크릿 키 등)을 그대로 노출 - 원인 파악용
			log.warn("카카오페이 ready 실패: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getResponseBodyAsString()));
		} catch (Exception e) {
			// 원인 파악용 - 어떤 예외가 났는지 그대로 노출(디버그 끝나면 정리)
			log.warn("카카오페이 ready 실패(기타)", e);
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
					.body(Map.of("message", e.getClass().getSimpleName() + ": " + e.getMessage()));
		}
	}

	/** 카카오페이 결제 완료 후 돌아오는 콜백(GET, pg_token 쿼리파라미터 포함) - 승인 처리 후 예약 페이지로 리다이렉트. */
	@GetMapping("/kakao/approve")
	public ResponseEntity<Void> approveKakao(@RequestParam Long reservationId, @RequestParam("pg_token") String pgToken) {
		String redirect;
		try {
			ps.approveKakaoPayment(reservationId, pgToken);
			redirect = "/reservation?paid=success&reservationId=" + reservationId;
		} catch (Exception e) {
			log.warn("카카오페이 승인 처리 실패 reservationId={}", reservationId, e);
			redirect = "/reservation?paid=fail&reservationId=" + reservationId;
		}
		return ResponseEntity.status(HttpStatus.FOUND).header("Location", redirect).build();
	}

	/** 사용자가 카카오페이 결제창에서 취소한 경우 - 결제 못 받았으니 예약도 같이 취소해서 자리를 비운다. */
	@GetMapping("/kakao/cancel")
	public ResponseEntity<Void> cancelKakao(@RequestParam Long reservationId) {
		reservationService.cancelUnpaid(reservationId);
		return ResponseEntity.status(HttpStatus.FOUND)
				.header("Location", "/reservation?paid=cancel&reservationId=" + reservationId).build();
	}

	/** 카카오페이 쪽에서 결제 자체가 실패한 경우 - cancel과 동일하게 예약을 취소해서 자리를 비운다. */
	@GetMapping("/kakao/fail")
	public ResponseEntity<Void> failKakao(@RequestParam Long reservationId) {
		reservationService.cancelUnpaid(reservationId);
		return ResponseEntity.status(HttpStatus.FOUND)
				.header("Location", "/reservation?paid=fail&reservationId=" + reservationId).build();
	}
}
