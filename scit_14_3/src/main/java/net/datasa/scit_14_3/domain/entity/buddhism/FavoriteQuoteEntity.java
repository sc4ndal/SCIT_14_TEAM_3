package net.datasa.scit_14_3.domain.entity.buddhism;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/*
	회원이 저장(즐겨찾기)한 불교 한마디.
	(login_id, quote_id) 조합에 DB UNIQUE 제약이 걸려 있어 중복 저장이 안 된다.
 */
@Entity
@Table(name = "FAVORITE_QUOTE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteQuoteEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "favorite_quote_id")
	private Long favoriteQuoteId;

	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;

	@ManyToOne
	@JoinColumn(name = "quote_id", nullable = false)
	private DailyQuoteEntity quote;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
