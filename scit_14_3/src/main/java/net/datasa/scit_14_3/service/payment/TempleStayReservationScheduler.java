package net.datasa.scit_14_3.service.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 예약 상태를 매일 자동으로 정리하는 배치 두 가지.
 * 1) 계좌이체(무통장입금) 예약이 예약대기 상태로 3일(그레이스 기간) 넘게 방치되면 자동으로
 *    취소 처리 - 실제 로직은 PaymentService.cancelStalePendingBankTransfers() 참고.
 * 2) 이용 종료일이 지난 예약확정 건을 이용완료로 자동 전환 - 실제 로직은
 *    TempleStayReservationService.markPastReservationsCompleted() 참고.
 * (둘 다 WithdrawalScheduler와 동일한 패턴)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TempleStayReservationScheduler {

	private static final int GRACE_DAYS = 3;

	private final PaymentService paymentService;
	private final TempleStayReservationService reservationService;

	@Scheduled(cron = "0 30 3 * * *") // 매일 새벽 3시 30분 (WithdrawalScheduler와 안 겹치게)
	public void cancelStalePendingBankTransfers() {
		try {
			paymentService.cancelStalePendingBankTransfers(GRACE_DAYS);
		} catch (Exception e) {
			log.error("계좌이체 입금확인 자동취소 배치 실행 중 오류", e);
		}
	}

	@Scheduled(cron = "0 45 3 * * *") // 매일 새벽 3시 45분
	public void markPastReservationsCompleted() {
		try {
			int count = reservationService.markPastReservationsCompleted();
			if (count > 0) {
				log.info("이용 종료일이 지난 예약 {}건을 이용완료로 자동 전환함", count);
			}
		} catch (Exception e) {
			log.error("이용완료 자동전환 배치 실행 중 오류", e);
		}
	}
}
