package net.datasa.scit_14_3.domain.dto;

/*
	"불교란?" 페이지 마지막의 FAQ 아코디언 항목.
	자세한 예절은 사찰 예절 가이드와 겹치므로 여기서는 초압축 답변만 둔다.
 */
public record FaqItemDTO(String question, String answer) {
}
