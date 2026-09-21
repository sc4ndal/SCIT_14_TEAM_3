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
	// 서버가 쿠키(preferredLang)에서 채움 - 클라이언트가 보낸 값은 컨트롤러에서 덮어씀
	@Builder.Default
	private String lang = "ko";
	@Builder.Default
	private TempleStayReservationEntity.Status status = TempleStayReservationEntity.Status.예약확정;
	private LocalDateTime canceledAt;
	private LocalDateTime createdAt;
}
