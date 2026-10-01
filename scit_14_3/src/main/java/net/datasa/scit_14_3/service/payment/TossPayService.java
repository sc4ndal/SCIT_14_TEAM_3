package net.datasa.scit_14_3.service.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * 토스페이먼츠 결제위젯 연동 (https://docs.tosspayments.com/guides/v2/payment-widget/integration).
 * 카카오페이와 달리 결제창을 여는 건 서버 API가 아니라 클라이언트 JS SDK(TossPayments(clientKey))가
 * 직접 처리한다 - 서버는 결제창에서 돌아온 뒤 최종 승인(confirm)만 담당한다.
 * clientKey/secretKey는 토스페이먼츠 개발자센터(developers.tosspayments.com) 내 개발정보에서 발급.
 */
@Service
public class TossPayService {

	private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

	@Value("${toss.secret-key}")
	private String secretKey;

	private final RestTemplate restTemplate = new RestTemplate();

	private HttpHeaders authHeaders() {
		HttpHeaders headers = new HttpHeaders();
		String encoded = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
		headers.set("Authorization", "Basic " + encoded);
		headers.setContentType(MediaType.APPLICATION_JSON);
		return headers;
	}

	/** 결제 승인 - 결제위젯에서 돌아올 때 받은 paymentKey/orderId/amount로 최종 승인한다. */
	public Map<String, Object> confirm(String paymentKey, String orderId, int amount) {
		Map<String, Object> body = Map.of(
				"paymentKey", paymentKey,
				"orderId", orderId,
				"amount", amount
		);

		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, authHeaders());
		ResponseEntity<Map> response = restTemplate.postForEntity(CONFIRM_URL, requestEntity, Map.class);
		return response.getBody();
	}
}
