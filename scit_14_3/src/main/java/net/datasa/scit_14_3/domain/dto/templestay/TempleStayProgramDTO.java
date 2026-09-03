package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleStayProgramDTO {
	private Long programId;
	private Long templeId;
	private String templeName;     // 상세보기->추가
	private String templeAddress;  // 상세보기->추가
	private String title;
	private TempleStayProgramEntity.ProgramType programType;
	private String imageUrl;
	private String description;
	private String schedule;
	private String requiredItems;
	// 환불 규정/유의사항은 프로그램별이 아니라 사찰 공통이라 소속 사찰(TEMPLE)에서 가져옴
	private String templeRefundPolicy;
	private String templePrecautions;
	private int price;
	private String duration;
	// HTML5 <input type="date">는 값이 무조건 yyyy-MM-dd 형식이어야 함 - 이 지정이 없으면
	// 로케일에 따라 다른 형식으로 렌더링돼서 수정 폼에 값이 안 채워지는 것처럼 보임.
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	private LocalDate openStartDate;
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	private LocalDate openEndDate;
	@Builder.Default
	private int maxParticipant = 20;
	@Builder.Default
	private boolean supportEnglish = false;
	private BigDecimal latitude;
	private BigDecimal longitude;
	private LocalDateTime createdAt;
}
