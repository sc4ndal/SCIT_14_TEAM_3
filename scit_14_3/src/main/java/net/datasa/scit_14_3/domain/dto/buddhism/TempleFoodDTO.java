package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	화면/JSON 응답에 내려주는 사찰음식 추천 1건.
	recipeUrl은 DB 컬럼이 아니라 TempleFoodEntity.recipe 마지막 줄("참고 레시피: <url>")을
	TempleFoodService가 파싱해서 뽑아낸 값이다 - recipe는 그 줄을 뺀 나머지 본문.
	favorited는 로그인한 회원이 이 음식을 이미 즐겨찾기했는지 여부(비로그인이면 항상 false).
 */
public record TempleFoodDTO(Long recommendationId, String foodName, String description,
							 String recipe, String recipeUrl, String imageUrl, boolean favorited) {
}
