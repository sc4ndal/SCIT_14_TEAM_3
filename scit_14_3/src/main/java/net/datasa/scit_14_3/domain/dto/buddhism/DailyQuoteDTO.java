package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	화면/JSON 응답에 내려주는 불교 한마디 1건.
	favorited는 로그인한 회원이 이 한마디를 이미 즐겨찾기했는지 여부(비로그인이면 항상 false).
 */
public record DailyQuoteDTO(Long quoteId, String content, String source, boolean favorited) {
}
