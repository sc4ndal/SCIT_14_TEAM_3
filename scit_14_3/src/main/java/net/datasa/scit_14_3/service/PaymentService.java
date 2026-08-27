package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.PaymentDTO;
import net.datasa.scit_14_3.domain.entity.PaymentEntity;
import net.datasa.scit_14_3.repository.PaymentRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {
	private final PaymentRepository pr;
	public PaymentDTO getInfo(Long paymentId) {
		PaymentEntity entity = pr.findById(paymentId).orElseThrow(() -> new EntityNotFoundException("해당 데이터가 존재하지 않습니다."));
		
		return PaymentDTO.builder()
				.paymentId(entity.getPaymentId())
				.reservationId(entity.getReservationId())
				.paymentMethod(entity.getPaymentMethod())
				.amount(entity.getAmount())
				.status(entity.getStatus())
				.depositorName(entity.getDepositorName())
				.kakaoTid(entity.getKakaoTid())
				.paidAt(entity.getPaidAt())
				.createdAt(entity.getCreatedAt())
				.build();
	}
}
