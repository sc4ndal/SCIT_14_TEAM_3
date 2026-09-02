package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleStayReservationDTO {
	private Long reservationId;
	private String loginId;
	private Long programId;
	private LocalDate startDate;
	private LocalDate endDate;
	private int participantCount;
	private String note;
	@Builder.Default
	private TempleStayReservationEntity.Status status = TempleStayReservationEntity.Status.예약대기;
	private LocalDateTime canceledAt;
	private LocalDateTime createdAt;
}
