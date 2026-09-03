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
	
	public enum Status {
		예약확정, 취소, 이용완료
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
