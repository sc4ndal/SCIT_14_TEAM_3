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

	@Column(name = "recipe")
	private String recipe;

	@Column(name = "recipe_url", length = 255)
	private String recipeUrl;

	@Column(name = "image_url", length = 255)
	private String imageUrl;
}
