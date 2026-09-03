package net.datasa.scit_14_3.service.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 카카오페이 단건결제 API 연동 (https://developers.kakaopay.com/docs/payment/online/single-payment).
 * 흐름: ready(결제 준비) -> 사용자가 카카오페이 결제창에서 결제 -> 카카오가 approval_url로 리다이렉트
 * (pg_token 붙여서) -> approve(결제 승인) 호출로 최종 확정. cid/secret-key는 카카오페이
 * 개발자센터(카카오 로그인용 developers.kakao.com과는 다른 사이트) 앱 키에서 발급받은 값.
 */
@Service
public class KakaoPayService {

	private static final String READY_URL = "https://open-api.kakaopay.com/online/v1/payment/ready";
	private static final String APPROVE_URL = "https://open-api.kakaopay.com/online/v1/payment/approve";

	@Value("${kakaopay.secret-key}")
	private String secretKey;

	@Value("${kakaopay.cid:TC0ONETIME}")
	private String cid;

	private final RestTemplate restTemplate = new RestTemplate();

	private HttpHeaders authHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", "SECRET_KEY " + secretKey);
		headers.setContentType(MediaType.APPLICATION_JSON);
		return headers;
	}

	/** 결제 준비 - 성공하면 tid + 사용자를 보낼 결제 페이지 URL(next_redirect_pc_url)이 담긴 Map을 그대로 반환. */
	public Map<String, Object> ready(String partnerOrderId, String partnerUserId, String itemName,
	                                  int quantity, int totalAmount,
	                                  String approvalUrl, String cancelUrl, String failUrl) {
		Map<String, Object> body = new HashMap<>();
		body.put("cid", cid);
		body.put("partner_order_id", partnerOrderId);
		body.put("partner_user_id", partnerUserId);
		body.put("item_name", itemName);
		body.put("quantity", quantity);
		body.put("total_amount", totalAmount);
		body.put("tax_free_amount", 0);
		body.put("approval_url", approvalUrl);
		body.put("cancel_url", cancelUrl);
		body.put("fail_url", failUrl);

		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, authHeaders());
		ResponseEntity<Map> response = restTemplate.postForEntity(READY_URL, requestEntity, Map.class);
		return response.getBody();
	}

	/** 결제 승인 - approval_url로 돌아올 때 카카오가 붙여준 pg_token과 ready 때 받은 tid로 최종 승인. */
	public Map<String, Object> approve(String tid, String partnerOrderId, String partnerUserId, String pgToken) {
		Map<String, Object> body = new HashMap<>();
		body.put("cid", cid);
		body.put("tid", tid);
		body.put("partner_order_id", partnerOrderId);
		body.put("partner_user_id", partnerUserId);
		body.put("pg_token", pgToken);

		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, authHeaders());
		ResponseEntity<Map> response = restTemplate.postForEntity(APPROVE_URL, requestEntity, Map.class);
		return response.getBody();
	}
}
