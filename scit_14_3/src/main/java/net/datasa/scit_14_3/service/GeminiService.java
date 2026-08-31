package net.datasa.scit_14_3.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;

/**
 * 사찰 등록 문의 폼의 "장소 유형 AI 자동판별" 버튼용. 좌표만으로 바다/산/강 인접 여부를
 * 판단하려면 별도 지리 데이터셋이 필요해서, 대신 카카오맵이 이미 주는 장소명/주소 텍스트를
 * Gemini에 분류시킴(무료 티어, aistudio.google.com에서 키 발급). 결과는 참고용 - 체크박스에
 * 미리 체크만 해두고 사용자가 직접 고칠 수 있어서 틀려도 큰 문제 없음.
 */
@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    // gemini-2.5-flash-lite는 신규 사용자에게 제공 중단됨(Google API가 3.5로 안내함, 2026-08-31 확인)
    private static final String MODEL = "gemini-3.5-flash-lite";

    private final RestTemplate restTemplate = new RestTemplate();
    private final JsonMapper jsonMapper = new JsonMapper();

    /** 실패하면(키 미설정/API 오류/응답 파싱 실패) 전부 false로 - 자동판별은 참고용이라
        기능 전체를 막을 이유가 없음. 사용자가 체크박스를 직접 채우면 됨. */
    public Map<String, Boolean> classifyLocationTypes(String name, String address) {
        try {
            String prompt = """
                    다음 장소가 '바다', '산', '강', '도심' 중 어디에 해당하는지 판단해줘(중복 가능, 여러 개 해당될 수 있음).
                    장소 이름: %s
                    주소: %s
                    반드시 아래 JSON 형식으로만 답해:
                    {"sea": true or false, "mountain": true or false, "river": true or false, "urban": true or false}
                    """.formatted(name, address);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("responseMimeType", "application/json")
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL
                    + ":generateContent?key=" + apiKey;

            Map<?, ?> response = restTemplate.postForObject(url, requestEntity, Map.class);
            String text = extractText(response);
            Map<?, ?> parsed = jsonMapper.readValue(text, Map.class);

            return Map.of(
                    "sea", Boolean.TRUE.equals(parsed.get("sea")),
                    "mountain", Boolean.TRUE.equals(parsed.get("mountain")),
                    "river", Boolean.TRUE.equals(parsed.get("river")),
                    "urban", Boolean.TRUE.equals(parsed.get("urban"))
            );
        } catch (Exception e) {
            log.warn("장소 유형 AI 자동판별 실패 - 전부 false로 처리함: {}", e.getMessage());
            return Map.of("sea", false, "mountain", false, "river", false, "urban", false);
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
