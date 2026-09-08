package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	"사찰 예절 가이드"의 아코디언 카드 한 장.

	letter는 화면에서 카드 앞에 붙는 A~H 순번 배지다. BUDDHISM_INFO에 해당 컬럼이
	없어서 조회 순서(post_id 오름차순)대로 서비스가 매겨준다.
	content는 "• 액션 / → 이유" 형식의 원문 그대로이고, 파싱은 etiquetteGuide.js의
	parseContent()가 담당한다.
 */
public record EtiquetteCategoryDTO(String letter, String title, String content) {
}
