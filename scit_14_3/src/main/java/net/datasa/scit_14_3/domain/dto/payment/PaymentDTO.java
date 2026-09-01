package net.datasa.scit_14_3.domain.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.payment.PaymentEntity;

import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
	private Long paymentId;
	private Long reservationId;
	private PaymentEntity.PaymentMethod paymentMethod;
	private int amount;
	@Builder.Default
	private PaymentEntity.Status status = PaymentEntity.Status.대기;
	private String depositorName;
	private String kakaoTid;
	private LocalDateTime paidAt;
	private LocalDateTime createdAt;
}
