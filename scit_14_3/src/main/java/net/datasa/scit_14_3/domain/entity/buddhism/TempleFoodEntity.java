package net.datasa.scit_14_3.domain.entity.buddhism;

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

/*
	사찰음식 추천 1건.
	DB에 레시피 참고 링크용 별도 컬럼이 없어서(recipe_url 컬럼 추가는 팀 DB 마이그레이션 필요),
	recipe 텍스트 마지막 줄에 "참고 레시피: <url>" 형식으로 함께 저장한다.
	TempleFoodService.toDto()가 이 마지막 줄을 파싱해서 recipe 본문과 recipeUrl로 분리한다.
 */
@Entity
@Table(name = "TEMPLE_FOOD_RECOMMENDATION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TempleFoodEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "recommendation_id")
	private Long recommendationId;

	@Column(name = "food_name", length = 50, nullable = false)
	private String foodName;

	@Column(name = "description")
	private String description;

	// 마지막 줄에 "참고 레시피: <url>"이 포함될 수 있음 - TempleFoodService 참고
	@Column(name = "recipe")
	private String recipe;

	@Column(name = "image_url", length = 255)
	private String imageUrl;
}
