package net.datasa.scit_14_3.controller.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.service.payment.PaymentService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
// @Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentController {
	private final PaymentService ps;
	@GetMapping("/{paymentId}")
	public PaymentDTO getPayment(@PathVariable("paymentId") Long paymentId) {
		return ps.getInfo(paymentId);
	}
}
