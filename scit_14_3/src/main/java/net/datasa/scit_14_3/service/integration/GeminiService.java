package net.datasa.scit_14_3.service.integration;

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
                    다음 장소가 '바다', '산', '강', '도심' 각각에 해당하는지 하나씩 독립적으로 판단해줘.
                    4개는 서로 배타적이지 않고 여러 개가 동시에 해당될 수 있음 - 하지만 실제로 그 장소의
                    특징으로 알려진 것만 true로 표시하고, 막연히 "한국이니까 이럴 것 같다"는 식의 일반화나
                    추측으로 true를 늘리지는 마.

                    참고 예시:
                    - 해동용궁사(부산): 바닷가 절벽 바위산 위에 지어짐 -> sea=true, mountain=true, river=false, urban=false
                    - 조계사(서울 종로 도심 한복판): 평지 도심 사찰, 산이나 강과 무관 -> sea=false, mountain=false, river=false, urban=true
                    - 해인사(경남 합천 산속): 전형적인 산사 -> sea=false, mountain=true, river=false, urban=false

                    장소 이름: %s
                    주소: %s

                    각 항목 판단 기준(그 장소의 실제 특징에 근거해서만 true):
                    - sea: 바다/해안가에 실제로 인접해 있는가
                    - mountain: 산속/산기슭/구릉지에 실제로 위치해 있는가 (도심 평지 사찰은 false)
                    - river: 강/하천/계곡물이 그 장소의 특징으로 알려질 정도로 가까운가
                    - urban: 도심/시가지 생활권 안에 있는가

                    반드시 아래 JSON 형식으로만 답해(설명 없이 JSON만):
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
