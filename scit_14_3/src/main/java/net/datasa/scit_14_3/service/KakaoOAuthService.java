package net.datasa.scit_14_3.service;

import net.datasa.scit_14_3.domain.dto.kakao.KakaoTokenResponse;
import net.datasa.scit_14_3.domain.dto.kakao.KakaoUserInfoResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

@Service
public class KakaoOAuthService {
	
	@Value("${kakao.client-id}")
	private String clientId;
	
	@Value("${kakao.redirect-uri}")
	private String redirectUri;

	/** 카카오 액세스 토큰을 세션에 담아둘 때 쓰는 키. 로그아웃 시 이 토큰으로 REST API 로그아웃 호출함. */
	public static final String ACCESS_TOKEN_SESSION_KEY = "kakaoAccessToken";

	// 카카오 디벨로퍼스 > 앱 > 플랫폼 키 > REST API 키 > 클라이언트 시크릿이 "사용함"으로
	// 켜져 있을 때만 필요. application.yml에 kakao.client-secret 자체를 안 넣으면 빈
	// 문자열로 들어오고, 아래에서 비어있으면 요청에서 자동으로 빠짐(꺼둔 경우 안 써도 됨).
	@Value("${kakao.client-secret:}")
	private String clientSecret;
	
	private final RestTemplate restTemplate = new RestTemplate();
	private final JsonMapper jsonMapper = new JsonMapper();
	
	/** /login/kakao 에서 이 URL로 리다이렉트. state는 카카오가 콜백 때 그대로 돌려주므로,
	    "가입 버튼으로 왔는지 로그인 버튼으로 왔는지"(intent)를 왕복시키는 용도로 씀. */
	public String buildAuthorizeUrl(String state) {
		return UriComponentsBuilder.fromUriString("https://kauth.kakao.com/oauth/authorize")
				.queryParam("client_id", clientId)
				.queryParam("redirect_uri", redirectUri)
				.queryParam("response_type", "code")
				.queryParam("state", state)
				.build()
				.toUriString();
	}
	
	/** 카카오 REST API 로그아웃. 브라우저 리다이렉트/확인화면 없이 서버 대 서버로 바로 처리됨 -
	    이 토큰으로 다음번 로그인 때는 카카오 쪽에서 다시 인증(QR/비번)을 물어보게 됨.
	    실패해도(토큰 만료 등) 예외를 밖으로 던지지 않음 - 우리 쪽 로그아웃까지 막히면 안 되므로. */
	public void logout(String accessToken) {
		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(accessToken);
		HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
		try {
			restTemplate.postForEntity("https://kapi.kakao.com/v1/user/logout", requestEntity, String.class);
		} catch (Exception e) {
			// 무시 - 카카오 쪽 로그아웃 실패해도 우리 사이트 로그아웃은 정상 진행돼야 함
		}
	}

	/** 인가 코드(code) -> 액세스 토큰 교환 */
	public KakaoTokenResponse getAccessToken(String code) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		
		MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
		body.add("grant_type", "authorization_code");
		body.add("client_id", clientId);
		body.add("redirect_uri", redirectUri);
		body.add("code", code);
		if (StringUtils.hasText(clientSecret)) {
			body.add("client_secret", clientSecret);
		}
		
		HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
		
		ResponseEntity<KakaoTokenResponse> response = restTemplate.postForEntity(
				"https://kauth.kakao.com/oauth/token",
				requestEntity,
				KakaoTokenResponse.class
		);
		return response.getBody();
	}
	
	/** 액세스 토큰으로 카카오 회원정보(회원번호/이메일/닉네임) 조회 */
	public KakaoUserInfoResponse getUserInfo(String accessToken) {
		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(accessToken);
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		
		HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
		
		// 타입(KakaoUserInfoResponse)으로 바로 안 받고, 일단 Map으로 원본 그대로 받는다.
		// 우리가 미리 정의 안 해둔 필드는 KakaoUserInfoResponse로 받으면 조용히 버려지기 때문.
		ResponseEntity<Map> rawResponse = restTemplate.exchange(
				"https://kapi.kakao.com/v2/user/me",
				HttpMethod.GET,
				requestEntity,
				Map.class
		);
		
		// ===== [디버그] 카카오가 실제로 주는 모든 키:값 출력 - 확인 끝나면 이 블록 지우세요 =====
		System.out.println("========== 카카오 사용자 정보 (전체 필드) ==========");
		printMap(rawResponse.getBody(), "");
		System.out.println("===================================================");
		// ===== 디버그 끝 =====
		
		// 위에서 받은 원본 Map을 그대로 우리 DTO 형태로 다시 변환해서 리턴
		// (API를 두 번 호출하지 않기 위함)
		return jsonMapper.convertValue(rawResponse.getBody(), KakaoUserInfoResponse.class);
	}
	
	@SuppressWarnings("unchecked")
	private void printMap(Map<?, ?> map, String indent) {
		if (map == null) return;
		for (Map.Entry<?, ?> entry : map.entrySet()) {
			Object value = entry.getValue();
			if (value instanceof Map) {
				System.out.println(indent + entry.getKey() + ":");
				printMap((Map<?, ?>) value, indent + "  ");
			} else {
				System.out.println(indent + entry.getKey() + " : " + value);
			}
		}
	}
}