package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
	불교 정보 게시글 (관리자 작성)
	category에는 '용어', '예절가이드' 같은 대분류만 저장하고,
	"불교 용어" 페이지의 8개 소분류는 TermCategory에서 제목 기준으로 매핑한다.
 */
@Entity
@Table(name = "buddhism_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuddhismInfoEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "post_id")
	private Long postId;

	@Column(name = "category", length = 30, nullable = false)
	private String category;

	@Column(name = "title", length = 150, nullable = false)
	private String title;

	@Column(name = "content", nullable = false)
	private String content;

	@Column(name = "view_count", nullable = false)
	private Integer viewCount;

	// DB에서 DEFAULT CURRENT_TIMESTAMP로 채우므로 애플리케이션에서는 읽기 전용
	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
