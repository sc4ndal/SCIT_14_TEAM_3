package net.datasa.scit_14_3.domain.dto.inquiry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.inquiry.TempleInquiryEntity;

import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleInquiryDto {
	private Long inquiryId;
	private String loginId;
	private String nickname;    // 사찰용 목록/상세 화면 표시용(작성자 법명) - JOIN 결과로만 채워짐
	private Long templeId;
	private String templeName;  // 마이페이지 목록/상세 화면 표시용 - JOIN 결과로만 채워짐
	private Long reservationId;
	private String title;
	private String content;
	private String answer;
	private TempleInquiryEntity.Status status;
	private LocalDateTime createdAt;
	private LocalDateTime answeredAt;
}
