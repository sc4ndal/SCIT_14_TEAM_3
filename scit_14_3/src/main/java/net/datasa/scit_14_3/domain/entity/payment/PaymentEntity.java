package net.datasa.scit_14_3.domain.entity.payment;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "PAYMENT")
public class PaymentEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "payment_id")
	private Long paymentId;
	
	@Column(name = "reservation_id", nullable = false, unique = true)
	private Long reservationId;
	
	public enum PaymentMethod {
		계좌이체, 카드
	}
	@Enumerated(EnumType.STRING)
	@Column(name = "payment_method", nullable = false)
	private PaymentMethod paymentMethod;
	
	@Column(name = "amount", nullable = false)
	private int amount;
	
	public enum Status {
		대기, 완료, 취소, 환불
	}
	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private Status status = Status.대기;
	
	@Column(name = "depositor_name", length = 50)	// 계좌이체 전용
	private String depositorName;
	
	@Column(name = "toss_payment_key", length = 200)	// 카드 결제(토스) 전용
	private String tossPaymentKey;

	@Column(name = "payment_detail", length = 50)		// 토스 confirm 응답에서 받은 실제 결제수단(카드사명/간편결제사명 등)
	private String paymentDetail;

	@Column(name = "paid_at")
	private LocalDateTime paidAt;
	
	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
