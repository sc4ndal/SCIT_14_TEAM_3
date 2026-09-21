package net.datasa.scit_14_3.controller.integration;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.chat.ChatRequestDTO;
import net.datasa.scit_14_3.domain.dto.chat.ChatResponseDTO;
import net.datasa.scit_14_3.service.integration.ChatService;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** 홈 화면 챗봇 위젯용 - 불교/사이트 안내 Q&A. */
@RestController
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;

	@PostMapping("/api/chat")
	public ChatResponseDTO chat(@RequestBody ChatRequestDTO request,
			@CookieValue(value = "preferredLang", defaultValue = "ko") String preferredLang) {
		String reply = chatService.reply(request.message(), request.history(), preferredLang);
		return new ChatResponseDTO(reply);
	}
}
