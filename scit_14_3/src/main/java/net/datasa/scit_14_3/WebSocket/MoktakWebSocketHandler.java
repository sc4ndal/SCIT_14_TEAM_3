package net.datasa.scit_14_3.WebSocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MoktakWebSocketHandler extends TextWebSocketHandler {
	
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
	private final MoktakChatFilter chatFilter = new MoktakChatFilter();
	
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		sessions.put(session.getId(), session);
		broadcastPresence("JOIN");
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		sessions.remove(session.getId());
		broadcastPresence("LEAVE");
	}
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		Map<?, ?> payload;
		try {
			payload = objectMapper.readValue(message.getPayload(), Map.class);
		} catch (Exception e) {
			return; // 형식이 잘못된 메시지는 무시
		}
		
		Object typeObj = payload.get("type");
		String type = typeObj == null ? "" : typeObj.toString();
		
		switch (type) {
			case "CHAT":
				handleChat(session, payload);
				break;
			case "HIT":
				// 현재는 클라이언트 로컬 카운트만 사용. 필요해지면 여기서 브로드캐스트 추가.
				break;
			case "PING":
				// 클라이언트 하트비트(moktak.js) - 보낸 사람에게만 PONG으로 답한다.
				// Nginx는 "서버 -> 브라우저" 방향으로 60초(설정은 1시간) 동안 데이터가 없으면 연결을
				// 끊는데, 이 응답이 그 무활동 타이머를 리셋해서 조용한 연결이 유지된다.
				// 클라이언트는 이 응답이 오는지로 죽은 연결(조용히 끊긴 네트워크)도 감지한다.
				sendPong(session);
				break;
			case "JOIN":
			case "LEAVE":
				// 연결/종료는 afterConnectionEstablished/Closed에서 이미 처리함.
				break;
			default:
				break;
		}
	}
	
	private void handleChat(WebSocketSession session, Map<?, ?> payload) throws IOException {
		Object rawText = payload.get("text");
		if (rawText == null) return;
		
		MoktakChatFilter.FilterResult result = chatFilter.filter(session.getId(), rawText.toString());
		if (!result.isAllowed()) {
			return; // 쿨다운/빈 메시지 등은 조용히 무시
		}
		
		Map<String, Object> out = new HashMap<>();
		out.put("type", "CHAT");
		out.put("text", result.getFilteredText());
		out.put("participantCount", sessions.size());
		broadcast(out);
	}
	
	/** 하트비트 응답 - 전체 브로드캐스트가 아니라 PING을 보낸 세션 한 곳에만 보낸다. */
	private void sendPong(WebSocketSession session) throws IOException {
		if (session.isOpen()) {
			// broadcast()와 같은 이유로 세션 단위로 동기화(같은 세션에 동시에 두 스레드가 쓰면 예외가 남)
			synchronized (session) {
				session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
			}
		}
	}

	private void broadcastPresence(String type) throws IOException {
		Map<String, Object> out = new HashMap<>();
		out.put("type", type);
		out.put("participantCount", sessions.size());
		broadcast(out);
	}
	
	private void broadcast(Map<String, Object> payload) throws IOException {
		String json = objectMapper.writeValueAsString(payload);
		TextMessage message = new TextMessage(json);
		for (WebSocketSession s : sessions.values()) {
			if (s.isOpen()) {
				synchronized (s) {
					s.sendMessage(message);
				}
			}
		}
	}
}