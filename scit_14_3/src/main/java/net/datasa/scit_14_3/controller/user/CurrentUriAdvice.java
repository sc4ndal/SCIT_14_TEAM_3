package net.datasa.scit_14_3.controller.user;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** 헤더의 "로그인" 링크가 지금 보던 페이지로 돌아올 수 있게 redirect 파라미터를 실어 보내야 하는데,
    Thymeleaf의 #httpServletRequest가 이 프로젝트 설정에서는 null이라(직접 확인함) 못 쓴다.
    대신 모든 화면에 현재 요청 경로를 공통 모델 값으로 주입해서 fragments/common-includes.html이
    그걸 그대로 쓰게 한다. AdminNoticeAdvice/TempleNoticeAdvice와 동일한 패턴. */
@ControllerAdvice
public class CurrentUriAdvice {

	@ModelAttribute("currentUri")
	public String currentUri() {
		if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes servletAttrs) {
			return servletAttrs.getRequest().getRequestURI();
		}
		return "/";
	}
}
