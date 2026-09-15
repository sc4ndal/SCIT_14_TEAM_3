package net.datasa.scit_14_3.domain.entity.templestay;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/*
	회원이 좋아요를 누른 템플스테이 후기.
	(login_id, review_id) 조합에 DB UNIQUE 제약이 걸려 있어 중복 좋아요가 안 된다
	(테이블 코멘트 그대로 "중복 좋아요 방지 겸용") - TempleStayReviewEntity.likeCount는
	이 테이블 등록/삭제와 함께 증감시켜주는 비정규화 카운터.
 */
@Entity
@Table(name = "FAVORITE_REVIEW")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteReviewEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "favorite_review_id")
	private Long favoriteReviewId;

	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;

	@ManyToOne
	@JoinColumn(name = "review_id", nullable = false)
	private TempleStayReviewEntity review;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
