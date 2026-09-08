package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleStayReviewDTO {
	private Long reviewId;
	private Long reservationId;
	private String loginId;
	// primitive int로 두면 요청 바디에 없는 필드(예: PATCH의 likeCount/viewCount)를 Jackson이
	// null -> int로 매핑하려다 MismatchedInputException을 던진다 - 전부 Integer로 nullable하게 둠.
	private Integer rating;
	private String content;
	private List<String> imageUrls;
	private Integer likeCount;
	private Integer viewCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
