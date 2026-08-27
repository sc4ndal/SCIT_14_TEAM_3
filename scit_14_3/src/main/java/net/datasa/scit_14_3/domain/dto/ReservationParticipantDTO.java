package net.datasa.scit_14_3.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.ReservationParticipantEntity;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationParticipantDTO {
	private Long participantId;;
	private Long reservationId;
	private String name;
	private ReservationParticipantEntity.Gender gender;
	private String email;
}
