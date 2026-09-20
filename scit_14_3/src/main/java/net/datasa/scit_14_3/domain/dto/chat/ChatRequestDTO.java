package net.datasa.scit_14_3.domain.dto.chat;

import java.util.List;

/*
	홈 화면 챗봇 위젯 - POST /api/chat 요청 본문.
	history는 이번 message 이전까지의 대화(최근 몇 턴만) - 없으면 첫 질문.
 */
public record ChatRequestDTO(String message, List<ChatTurnDTO> history) {
}
