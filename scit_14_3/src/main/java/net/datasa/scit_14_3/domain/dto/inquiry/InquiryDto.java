package net.datasa.scit_14_3.domain.dto.inquiry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.inquiry.InquiryEntity;

import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InquiryDto {
	private Long inquiryId;
	private String loginId;
	private String nickname;   // 관리자 목록 화면 표시용 (작성자 법명) - JOIN 결과로만 채워짐
	private String title;
	private String content;
	private String answer;
	private InquiryEntity.Status status;
	private LocalDateTime createdAt;
	private LocalDateTime answeredAt;
}
