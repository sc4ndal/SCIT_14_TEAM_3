package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	화면/JSON 응답에 내려주는 사찰음식 추천 1건.
	recipeUrl은 TEMPLE_FOOD_RECOMMENDATION.recipe_url 컬럼(레시피 참고 링크 전용)을 그대로 담는다.
	favorited는 로그인한 회원이 이 음식을 이미 즐겨찾기했는지 여부(비로그인이면 항상 false).
 */
public record TempleFoodDTO(Long recommendationId, String foodName, String description,
							 String recipe, String recipeUrl, String imageUrl, boolean favorited) {
}
