package net.datasa.scit_14_3.domain.dto.templestay;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 전체 후기 모아보기(/reservation/reviews)용 응답 DTO.
 * 리뷰 엔티티에는 사찰/프로그램/작성자 이름이 없어서(마이페이지 '내가 쓴 리뷰'는 프론트에서
 * 예약/사찰/프로그램을 따로 불러와 붙임), 여기서는 서버가 예약→프로그램→사찰, login_id→닉네임을
 * 미리 조인해서 한 번에 내려준다.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleStayReviewListDTO {
	private Long reviewId;
	private Long reservationId;    // "수정하기" 링크(/mypage/reviews/write?reservationId=...)용
	private String loginId;        // 현재 로그인 사용자와 비교해 본인 글이면 수정 링크를 노출
	private Long templeId;
	private String templeName;
	private Long programId;
	private String programName;   // 프로그램 제목 - 목록에서 후기 제목 자리에 쓰임
	private Integer rating;
	private String authorName;    // 작성자 법명(닉네임)
	private String content;
	private List<String> imageUrls;
	private Integer likeCount;
	private Integer viewCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
