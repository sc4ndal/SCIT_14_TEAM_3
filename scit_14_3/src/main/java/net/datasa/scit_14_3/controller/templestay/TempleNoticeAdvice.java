package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.inquiry.TempleInquiryService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** 사찰 계정 헤더 드롭다운의 "1:1 문의"/"사찰 프로그램 관리" 옆 알림 점(빨간 점) 표시용 -
    AdminNoticeAdvice와 동일한 패턴. 모든 화면에 공통 주입되며, 사찰 계정이 아니면 항상 0. */
@ControllerAdvice
@RequiredArgsConstructor
public class TempleNoticeAdvice {

	private final TempleInquiryService templeInquiryService;
	private final TempleStayReservationService reservationService;

	@ModelAttribute("pendingTempleInquiryCount")
	public long pendingTempleInquiryCount() {
		Long templeId = currentTempleId();
		return templeId != null ? templeInquiryService.getPendingCount(templeId) : 0;
	}

	@ModelAttribute("pendingBankTransferConfirmCount")
	public long pendingBankTransferConfirmCount() {
		Long templeId = currentTempleId();
		return templeId != null ? reservationService.countPendingBankTransferByTemple(templeId) : 0;
	}

	private Long currentTempleId() {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.getPrincipal() instanceof AppUserDetails details && details.isTempleAccount()) {
			return details.getTempleId();
		}
		return null;
	}
}
