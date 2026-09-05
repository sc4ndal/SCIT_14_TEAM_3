package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;

import java.time.LocalDate;

/**
 * 사찰 프로그램 관리 > 상세보기 화면 전용 - 예약 한 건 + 그 예약 대표자 인적사항을 한 줄로 보여주기
 * 위한 조회 전용 뷰 모델(저장 안 함). TEMPLE_STAY_RESERVATION과 RESERVATION_PARTICIPANT를 합친 것.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgramReservationDTO {
	private Long reservationId;
	private String representativeName;
	private String representativeEmail;
	private String representativePhone;
	private int participantCount;
	private LocalDate startDate;
	private LocalDate endDate;
	private TempleStayReservationEntity.Status status;
}
