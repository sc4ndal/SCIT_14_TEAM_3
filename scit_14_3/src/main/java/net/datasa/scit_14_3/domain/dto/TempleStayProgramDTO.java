package net.datasa.scit_14_3.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.TempleStayProgramEntity;

import java.math.BigDecimal;
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
	private String refundPolicy;
	private String precautions;
	private int price;
	private String duration;
	@Builder.Default
	private int maxParticipant = 20;
	@Builder.Default
	private boolean supportEnglish = false;
	private BigDecimal latitude;
	private BigDecimal longitude;
	private LocalDateTime createdAt;
}
