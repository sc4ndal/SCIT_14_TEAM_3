package net.datasa.scit_14_3.controller.integration;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.integration.GeminiService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 사찰 등록 문의/등록 폼의 "장소 유형 AI 자동판별" 버튼용 - 결과는 참고용, 강제 아님. */
@RestController
@RequiredArgsConstructor
public class LocationTypeController {

	private final GeminiService geminiService;

	@PostMapping("/api/location-type/classify")
	public Map<String, Boolean> classify(@RequestBody Map<String, String> body) {
		return geminiService.classifyLocationTypes(body.get("name"), body.get("address"));
	}
}
