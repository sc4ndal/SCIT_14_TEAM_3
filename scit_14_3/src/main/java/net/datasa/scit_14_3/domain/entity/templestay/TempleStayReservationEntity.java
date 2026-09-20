package net.datasa.scit_14_3.domain.entity.templestay;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE_STAY_RESERVATION")
public class TempleStayReservationEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "reservation_id")
	private Long reservationId;
	
	@Column(name = "login_id",nullable = false, length = 30)
	private String loginId;
	
	@Column(name = "program_id", nullable = false)
	private Long programId;
	
	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;
	
	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;
	
	@Column(name = "participant_count", nullable = false)
	private int participantCount;
	
	@Column(name = "note", columnDefinition = "TEXT")
	private String note;
	
	// 예약대기: 계좌이체(무통장입금) 결제 시 임시로 걸리는 상태 - 사찰이 입금을 확인하고
	// "입금확인" 처리해야 예약확정으로 넘어간다. 신청 후 3일 안에 확정 안 되면
	// TempleStayReservationScheduler가 자동으로 취소 처리한다. 카카오페이는 실시간
	// 전자결제라 이 상태를 거치지 않고 바로 예약확정으로 생성된다.
	public enum Status {
		예약대기, 예약확정, 취소, 이용완료
	}

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private Status status = Status.예약확정;
	
	@Column(name = "canceled_at")
	private LocalDateTime canceledAt;
	
	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;
}
