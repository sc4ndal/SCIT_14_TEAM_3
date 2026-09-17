package net.datasa.scit_14_3.domain.dto.chat;

/*
	홈 화면 챗봇 위젯의 대화 한 마디. role은 "user" 또는 "model"(Gemini 응답)만 온다.
	대화 이력은 서버에 저장하지 않고, 매 요청마다 브라우저가 들고 있던 걸 그대로 실어 보낸다.
 */
public record ChatTurnDTO(String role, String text) {
}
