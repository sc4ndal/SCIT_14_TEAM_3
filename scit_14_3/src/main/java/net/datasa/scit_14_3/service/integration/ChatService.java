package net.datasa.scit_14_3.service.integration;

import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.chat.ChatTurnDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 홈 화면 챗봇 위젯용 - 불교 상식과 이 사이트(佛선자) 안내를 답하는 Q&A 챗봇.
 * GeminiService(장소 유형 자동판별)와 같은 Gemini REST API를 쓰되, 이쪽은 JSON 한 건이
 * 아니라 자유 텍스트 멀티턴 대화라 별도 서비스로 분리했다.
 * 대화 이력은 서버에 저장하지 않는다 - 브라우저가 세션 동안 들고 있다가 매 요청마다 같이 보낸다.
 */
@Slf4j
@Service
public class ChatService {

	@Value("${gemini.api-key}")
	private String apiKey;

	// GeminiService와 동일한 모델 사용 (gemini-2.5-flash-lite는 신규 사용자에게 제공 중단됨)
	private static final String MODEL = "gemini-3.5-flash-lite";

	// 대화가 길어져도 요청이 과도하게 커지지 않도록 최근 N턴만 실어 보낸다.
	private static final int MAX_HISTORY_TURNS = 10;

	private static final String SYSTEM_INSTRUCTION = """
			너는 불교 종합 사이트 "佛선자(불선자)"의 안내 챗봇이야. 다음 두 가지 역할을 한다:
			1) 불교에 대한 일반적인 질문(교리, 용어, 역사, 수행법 등)에 쉽고 친절하게 답한다 -
			   불교를 처음 접하는 사람도 이해할 수 있게 짧고 명확하게 설명한다.
			2) 이 사이트를 어떻게 이용하면 되는지 안내한다. 홈 화면은 아래 4개 섹션으로 구성되어
			   있고, 각 섹션 안에 메뉴(링크)가 있다. 질문 내용과 관련 있으면 "홈 화면의 '섹션명'에서
			   '메뉴명'을 눌러보세요"처럼 섹션명과 메뉴명으로만 안내하고, 아래 목록에 없는 메뉴를
			   지어내지 마라:
			   - 알아보기: 불교란?(처음 접하는 사람을 위한 7단계 로드맵) / 불교 용어(용어 사전) /
			     사찰 음식(레시피 포함) / 오늘의 불교 한마디
			   - 찾아보기: 사찰 찾아보기(지도) / 불교 행사(박람회, 법회 일정 등)
			   - 준비하기: 사찰 예절 가이드 / 첫 방문 시뮬레이션
			   - 체험하기: 템플스테이 / 온라인 목탁회 / 체험 후기

			   로그인한 회원은 화면 우측 상단의 닉네임에 마우스를 올리면 "마이페이지" 드롭다운 메뉴가
			   뜨고, 여기서 아래 메뉴들을 이용할 수 있다. 사용자가 즐겨찾기/저장/관심 목록처럼 "내가
			   저장해둔 것"을 어디서 보냐고 물으면 이 목록에서 답해라:
			   - 마이페이지, 회원정보수정, 예약목록, 내가 쓴 리뷰,
			     관심 사찰, 관심 행사, 저장한 불교 한마디, 관심 사찰음식, 좋아요한 리뷰, 1:1 문의

			답변 규칙:
			- 반드시 한국어로, 친근하고 정중한 말투로 답한다.
			- 최대한 3~5문장 이내로 간결하게 답한다. 장황한 설명은 피한다.
			- 답변은 순수 텍스트로만 작성한다. 마크다운 문법(**굵게**, [링크](url), #제목, - 목록 등)을
			  절대 쓰지 마라.
			- URL 경로(/info/terms, /findtemple 같은 것)는 답변에 절대 언급하지 마라. 사용자가
			  화면에서 직접 찾아갈 수 있도록, 홈 화면 메뉴는 "섹션명 → 메뉴명" 형태로, 마이페이지
			  메뉴는 "닉네임에 마우스를 올려 마이페이지 드롭다운에서 → 메뉴명"처럼 안내해라.
			- 불교나 이 사이트 이용과 무관한 질문(코딩, 정치, 개인정보 요청 등)에는
			  "저는 불교와 이 사이트 이용에 대해서만 답할 수 있어요"라고 정중히 안내하고
			  주제를 벗어나지 않는다.
			- 확실하지 않은 내용을 단정적으로 지어내지 말고, 모르면 모른다고 말한다.
			""";

	private static final String KOREAN_RULE = "- 반드시 한국어로, 친근하고 정중한 말투로 답한다.";

	// 화면 언어(쿠키 preferredLang)에 맞춰 답변 언어만 바꿔 끼운다. 그 외 규칙은 그대로 유지.
	private static String instructionFor(String lang) {
		if ("ja".equals(lang)) {
			return SYSTEM_INSTRUCTION.replace(KOREAN_RULE,
					"- 반드시 일본어(です・ます調)로 친근하고 정중하게 답한다. 사용자가 다른 언어로 질문해도 일본어로 답한다. "
					+ "홈 화면 섹션명/메뉴명은 위 한국어 원문을 자연스러운 일본어로 옮겨서 안내하고, 거절 안내 문구도 일본어로 말한다.");
		}
		if ("en".equals(lang)) {
			return SYSTEM_INSTRUCTION.replace(KOREAN_RULE,
					"- 반드시 영어로 친근하고 정중하게 답한다. 사용자가 다른 언어로 질문해도 영어로 답한다. "
					+ "홈 화면 섹션명/메뉴명은 위 한국어 원문을 자연스러운 영어로 옮겨서 안내하고, 거절 안내 문구도 영어로 말한다.");
		}
		return SYSTEM_INSTRUCTION;
	}

	private static String failureMessage(String lang) {
		return "ja".equals(lang) ? "現在、回答を取得できませんでした。しばらくしてからもう一度お試しください。"
				: "en".equals(lang) ? "Sorry, I couldn't get an answer right now. Please try again in a moment."
				: "지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.";
	}

	/** 실패하면(키 미설정/API 오류/응답 파싱 실패) 사용자에게 보여줄 안내 문구를 그대로 반환한다. */
	public String reply(String message, List<ChatTurnDTO> history, String lang) {
		try {
			List<Map<String, Object>> contents = new ArrayList<>();
			if (history != null) {
				int start = Math.max(0, history.size() - MAX_HISTORY_TURNS);
				for (ChatTurnDTO turn : history.subList(start, history.size())) {
					String role = "model".equals(turn.role()) ? "model" : "user";
					contents.add(Map.of("role", role, "parts", List.of(Map.of("text", turn.text()))));
				}
			}
			contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", message))));

			Map<String, Object> requestBody = Map.of(
					"system_instruction", Map.of("parts", List.of(Map.of("text", instructionFor(lang)))),
					"contents", contents
			);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

			String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL
					+ ":generateContent?key=" + apiKey;

			RestTemplate restTemplate = new RestTemplate();
			Map<?, ?> response = restTemplate.postForObject(url, requestEntity, Map.class);
			return extractText(response);
		} catch (Exception e) {
			log.warn("챗봇 응답 생성 실패: {}", e.getMessage());
			return failureMessage(lang);
		}
	}

	@SuppressWarnings("unchecked")
	private String extractText(Map<?, ?> response) {
		List<?> candidates = (List<?>) response.get("candidates");
		Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
		Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
		List<?> parts = (List<?>) content.get("parts");
		Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
		return (String) firstPart.get("text");
	}
}
