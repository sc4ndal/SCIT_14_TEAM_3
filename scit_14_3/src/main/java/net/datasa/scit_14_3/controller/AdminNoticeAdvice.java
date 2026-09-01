package net.datasa.scit_14_3.controller;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.TempleRegistrationRequestService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** 관리자 헤더 드롭다운의 "사찰 등록 요청 목록" 옆 알림 점(빨간 점) 표시용 - 모든 화면에 공통 주입. */
@ControllerAdvice
@RequiredArgsConstructor
public class AdminNoticeAdvice {

	private final TempleRegistrationRequestService requestService;

	@ModelAttribute("pendingTempleRequestCount")
	public long pendingTempleRequestCount() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isAdmin = auth != null && auth.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
		return isAdmin ? requestService.getPendingCount() : 0;
	}
}
