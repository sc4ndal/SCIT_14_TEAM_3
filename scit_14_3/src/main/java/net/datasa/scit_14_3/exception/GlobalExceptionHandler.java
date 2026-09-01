package net.datasa.scit_14_3.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.ui.Model;
import org.springframework.validation.BindException;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 뷰(Thymeleaf) 기반 전역 예외 처리기.
 * - 이용자에게는 일반화된 메시지 + 상태코드 + 문의번호(traceId)만 노출한다.
 * - 예외 타입 / root cause / 스택트레이스 등 상세는 서버 로그에만 traceId와 함께 남긴다.
 * - 렌더링 뷰: templates/errorView/error.html  (모델: message, status, traceId, timestamp)
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {
	
	private static final String ERROR_VIEW = "errorView/error";
	private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
	
	// 1. 인증 실패 (로그인 실패)
	@ExceptionHandler(AuthenticationException.class)
	@ResponseStatus(HttpStatus.UNAUTHORIZED)
	public String handleAuthentication(AuthenticationException e, HttpServletRequest request, Model model) {
		String traceId = fillErrorModel(model, HttpStatus.UNAUTHORIZED, "로그인이 필요하거나 인증에 실패했습니다.");
		log.warn("[{}] 인증 실패 {} {} : {}", traceId, request.getMethod(), request.getRequestURI(), e.getMessage());
		return ERROR_VIEW;
	}
	
	// 2. 인가 실패 (권한 없음)
	@ExceptionHandler(AccessDeniedException.class)
	@ResponseStatus(HttpStatus.FORBIDDEN)
	public String handleAccessDenied(AccessDeniedException e, HttpServletRequest request, Model model) {
		String traceId = fillErrorModel(model, HttpStatus.FORBIDDEN, "해당 요청에 대한 권한이 없습니다.");
		log.warn("[{}] 권한 없음 {} {} : {}", traceId, request.getMethod(), request.getRequestURI(), e.getMessage());
		return ERROR_VIEW;
	}
	
	// 3. 엔티티 조회 실패
	@ExceptionHandler(EntityNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public String handleEntityNotFound(EntityNotFoundException e, HttpServletRequest request, Model model) {
		String traceId = fillErrorModel(model, HttpStatus.NOT_FOUND, "요청하신 데이터를 찾을 수 없습니다.");
		// e.getMessage()에 엔티티명/PK가 담기므로 이용자 화면엔 넣지 않고 로그로만
		log.info("[{}] 엔티티 조회 실패 {} {} : {}", traceId, request.getMethod(), request.getRequestURI(), e.getMessage());
		return ERROR_VIEW;
	}
	
	// 4. @Valid 폼 바인딩 실패 (JS 검증 우회 등). message는 개발자가 정의한 문구라 노출 가능.
	@ExceptionHandler(BindException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public String handleBind(BindException e, HttpServletRequest request, Model model) {
		String summary = e.getBindingResult().getAllErrors().stream()
				.map(ObjectError::getDefaultMessage)
				.collect(Collectors.joining(" / "));
		if (summary.isBlank()) {
			summary = "입력값이 올바르지 않습니다.";
		}
		String traceId = fillErrorModel(model, HttpStatus.BAD_REQUEST, summary);
		log.warn("[{}] 검증 실패 {} {} : {}", traceId, request.getMethod(), request.getRequestURI(), summary);
		return ERROR_VIEW;
	}
	
	// 5. 매핑된 핸들러가 없는 주소 (오타 URL 등) → 404
	//    이걸 안 두면 아래 포괄 Exception 핸들러에 잡혀서 존재하지 않는 주소가 500으로 응답된다.
	@ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public String handleNotFound(Exception e, HttpServletRequest request, Model model) {
		String traceId = fillErrorModel(model, HttpStatus.NOT_FOUND, "요청하신 페이지를 찾을 수 없습니다.");
		log.info("[{}] 없는 주소 {} {}", traceId, request.getMethod(), request.getRequestURI());
		return ERROR_VIEW;
	}

	// 6. 그 외 모든 미처리 예외 → 500
	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public String handleException(Exception e, HttpServletRequest request, Model model) {
		String traceId = fillErrorModel(model, HttpStatus.INTERNAL_SERVER_ERROR,
				"일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
		
		Throwable root = NestedExceptionUtils.getMostSpecificCause(e);
		log.error("[{}] 처리되지 않은 예외 {} {} | type={}, rootType={}, rootMsg={}",
				traceId, request.getMethod(), request.getRequestURI(),
				e.getClass().getName(), root.getClass().getName(), root.getMessage(), e); // 마지막 e → 스택트레이스
		
		return ERROR_VIEW;
	}
	
	/**
	 * 에러 페이지가 요구하는 모델 속성(message/status/traceId/timestamp)을 채우고 traceId를 반환.
	 * 내부 정보(예외 타입, root cause, 쿼리스트링)는 절대 모델에 담지 않는다 — 로그 전용.
	 */
	private String fillErrorModel(Model model, HttpStatus status, String userMessage) {
		String traceId = UUID.randomUUID().toString().substring(0, 8);
		model.addAttribute("message", userMessage);
		model.addAttribute("status", status.value());
		model.addAttribute("traceId", traceId);
		model.addAttribute("timestamp", LocalDateTime.now().format(TS_FMT));
		return traceId;
	}
}