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
		계좌이체, 카카오페이
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
	
	@Column(name = "kakao_tid", length = 100)		// 카카오페이 전용
	private String kakaoTid;
	
	@Column(name = "paid_at")
	private LocalDateTime paidAt;
	
	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
