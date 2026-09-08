package net.datasa.scit_14_3.domain.entity.buddhism;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/*
	회원이 저장(즐겨찾기)한 사찰음식.
	(login_id, recommendation_id) 조합에 DB UNIQUE 제약이 걸려 있어 중복 저장이 안 된다.
 */
@Entity
@Table(name = "favorite_food")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteFoodEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "favorite_food_id")
	private Long favoriteFoodId;

	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;

	@ManyToOne
	@JoinColumn(name = "recommendation_id", nullable = false)
	private TempleFoodEntity food;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
