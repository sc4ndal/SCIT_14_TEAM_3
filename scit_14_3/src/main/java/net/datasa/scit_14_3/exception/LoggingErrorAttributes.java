package net.datasa.scit_14_3.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.webmvc.error.DefaultErrorAttributes;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.WebRequest;

import java.util.Map;
import java.util.UUID;

/**
 * Spring Boot 기본 에러 처리(/error, BasicErrorController) 경로로 넘어온 오류의 "사유"를 서버 로그에 남긴다.
 *
 * <p>{@link GlobalExceptionHandler}(@ControllerAdvice)는 <b>컨트롤러 실행 단계</b> 예외만 잡는다.
 * 그 이후 단계에서 터지는 오류 — 뷰(Thymeleaf) 렌더링 중 파싱/표현식 에러, 서블릿 필터 단계 예외,
 * 매핑되지 않은 URL(404), 정적 리소스 404, {@code error/error.html} 자체의 렌더링 실패 등 —
 * 은 예외 리졸버 체인을 타지 않아 그동안 로그가 전혀 남지 않았다.
 *
 * <p>이 클래스는 {@code /error} 디스패치마다 한 번 호출되는 {@link #getErrorAttributes} 를 가로채,
 * 원본 예외와 root cause / 상태코드 / 경로를 {@code log.debug}(스택트레이스 포함)로 기록한다.
 * 화면에는 여전히 traceId 만 노출하고, 상세는 로그에서 traceId 로 찾는다.
 * (debug 레벨: application.properties 의 {@code logging.level.net.datasa.scit_14_3=debug})
 */
@Slf4j
@Component
public class LoggingErrorAttributes extends DefaultErrorAttributes {

	/** 한 번의 에러 디스패치에서 getErrorAttributes 가 여러 번 불려도 로그는 1회만 남기기 위한 플래그 */
	private static final String ATTR_LOGGED = LoggingErrorAttributes.class.getName() + ".LOGGED";
	private static final String ATTR_TRACE_ID = "traceId";

	@Override
	public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
		Map<String, Object> attrs = super.getErrorAttributes(webRequest, options);

		// traceId 발급 → 로그와 화면(4xx/5xx.html)에서 동일 값으로 대조 가능
		String traceId = UUID.randomUUID().toString().substring(0, 8);
		attrs.put(ATTR_TRACE_ID, traceId);

		boolean alreadyLogged = Boolean.TRUE.equals(
				webRequest.getAttribute(ATTR_LOGGED, RequestAttributes.SCOPE_REQUEST));
		if (alreadyLogged) {
			return attrs;
		}
		webRequest.setAttribute(ATTR_LOGGED, Boolean.TRUE, RequestAttributes.SCOPE_REQUEST);

		Object status = attrs.get("status");
		Object path = attrs.get("path");
		Object message = attrs.get("message");
		Throwable error = getError(webRequest);

		if (error != null) {
			Throwable root = NestedExceptionUtils.getMostSpecificCause(error);
			// 마지막 인자 error → 스택트레이스까지 debug 로 출력
			log.debug("[{}] /error status={} path={} | type={}, rootType={}, rootMsg={}",
					traceId, status, path,
					error.getClass().getName(), root.getClass().getName(), root.getMessage(), error);
		} else {
			// 예외 객체 없이 상태코드만 있는 경우(예: 매핑 없는 404, response.sendError 직접 호출)
			log.debug("[{}] /error status={} path={} message={}", traceId, status, path, message);
		}

		return attrs;
	}
}
