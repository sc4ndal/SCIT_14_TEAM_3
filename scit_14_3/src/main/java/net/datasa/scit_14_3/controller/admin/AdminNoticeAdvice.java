package net.datasa.scit_14_3.controller.admin;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.inquiry.InquiryService;
import net.datasa.scit_14_3.service.temple.TempleRegistrationRequestService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** 관리자 헤더 드롭다운의 "사찰 등록 요청 목록"/"문의 목록" 옆 알림 점(빨간 점) 표시용 - 모든 화면에 공통 주입. */
@ControllerAdvice
@RequiredArgsConstructor
public class AdminNoticeAdvice {

	private final TempleRegistrationRequestService requestService;
	private final InquiryService inquiryService;

	@ModelAttribute("pendingTempleRequestCount")
	public long pendingTempleRequestCount() {
		return isAdmin() ? requestService.getPendingCount() : 0;
	}

	@ModelAttribute("pendingInquiryCount")
	public long pendingInquiryCount() {
		return isAdmin() ? inquiryService.getPendingCount() : 0;
	}

	private boolean isAdmin() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		return auth != null && auth.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
	}
}
