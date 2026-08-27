package net.datasa.scit_14_3.exception;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.nio.file.AccessDeniedException;

@Slf4j
@ControllerAdvice

public class GlobalExceptionHandler {
	
	
	// 1.로그인 인증 실패
	@ExceptionHandler({AccessDeniedException.class,})
	public String handleAAccessDenied(Exception e, Model model) {
		log.error("> [GlobalException] 인증 실패 : {}", e.getMessage());
		model.addAttribute("message", "인증 실패.");
		return "errorView/custom-error-page";
	}
	
	// 2. 계정 권한 없음
	@ExceptionHandler({AuthenticationException.class})
	public String handleAuthorizationDenied(Exception e, Model model) {
		log.error("> [GlobalException] 접근 권한 없음 : {}", e.getMessage());
		model.addAttribute("message", "접근 권한 없음.");
		return "errorView/custom-error-page";
	}
	
	// 3. Entity Not Found
	@ExceptionHandler(EntityNotFoundException.class)
	public String handleNotFound(EntityNotFoundException e, Model model) {
		log.debug("> [GlobalException] EntityNotFoundException : {}", e.getMessage());
		model.addAttribute("message", e.getMessage());
		return "errorView/custom-error-page";
	}
}
