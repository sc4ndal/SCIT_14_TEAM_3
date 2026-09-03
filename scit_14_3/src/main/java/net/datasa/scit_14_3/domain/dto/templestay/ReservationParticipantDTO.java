package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;

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
	private String phone;
}
