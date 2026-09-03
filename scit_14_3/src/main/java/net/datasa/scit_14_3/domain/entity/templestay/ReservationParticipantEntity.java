package net.datasa.scit_14_3.domain.entity.templestay;

import jakarta.persistence.*;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "RESERVATION_PARTICIPANT")
public class ReservationParticipantEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "participant_id")
	private Long participantId;
	
	@Column(name = "reservation_id", nullable = false)
	private Long reservationId;
	
	@Column(name = "name", length = 50, nullable = false)
	private String name;
	
	public enum Gender {
		남성, 여성
	}
	@Enumerated(EnumType.STRING)
	@Column(name = "gender", nullable = false)
	private Gender gender;
	
	@Column(name = "email", length = 100, nullable = false)
	private String email;

	@Column(name = "phone", length = 20)	// 대표자만 입력, 나머지는 NULL
	private String phone;
}