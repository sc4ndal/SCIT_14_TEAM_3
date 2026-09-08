package net.datasa.scit_14_3.domain.entity.templestay;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE_STAY_REVIEW")
public class TempleStayReviewEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "review_id")
	private Long reviewId;

	@Column(name = "reservation_id", nullable = false, unique = true)
	private Long reservationId;

	@Column(name = "login_id", nullable = false, length = 30)
	private String loginId;

	// DB 컬럼이 TINYINT라 byte로 매핑 (int로 매핑하면 ddl-auto=validate에서 타입 불일치로 기동 실패함)
	@Column(name = "rating", nullable = false)
	private byte rating;

	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	// Cloudinary에 업로드된 이미지 URL 목록 (무료 플랜: 장당 10MB 제한 - CloudinaryService 참고)
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "image_urls")
	private List<String> imageUrls;

	@Builder.Default
	@Column(name = "like_count", nullable = false)
	private int likeCount = 0;

	@Builder.Default
	@Column(name = "view_count", nullable = false)
	private int viewCount = 0;

	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime updatedAt;
}
