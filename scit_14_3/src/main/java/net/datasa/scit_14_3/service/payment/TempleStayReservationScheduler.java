package net.datasa.scit_14_3.service.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 예약 상태를 자동으로 정리하는 배치 세 가지.
 * 1) 계좌이체(무통장입금) 예약이 예약대기 상태로 3일(그레이스 기간) 넘게 방치되면 자동으로
 *    취소 처리 - 실제 로직은 PaymentService.cancelStalePendingBankTransfers() 참고.
 * 2) 이용 종료일이 지난 예약확정 건을 이용완료로 자동 전환 - 실제 로직은
 *    TempleStayReservationService.markPastReservationsCompleted() 참고.
 * 3) 카드결제가 대기 상태로 30분 넘게 방치되면(결제창 띄워놓고 탭 닫는 등 이탈) 자동으로
 *    취소 처리 - 실제 로직은 PaymentService.cancelStalePendingCardPayments() 참고. 다른 두
 *    배치와 달리 하루 한 번이 아니라 10분마다 도는데, 이탈한 자리를 너무 오래 묶어두면 다른
 *    사람이 그 자리에 신청을 못 하게 되기 때문이다(그래도 토스 결제 세션 자체가 30분 뒤
 *    만료되므로, 그레이스 기간을 그보다 짧게 잡지만 않으면 결제 중인 건을 잘못 취소할 위험은 없다).
 * (셋 다 WithdrawalScheduler와 동일한 패턴)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TempleStayReservationScheduler {

	private static final int GRACE_DAYS = 3;
	private static final int CARD_GRACE_MINUTES = 30;
	// 결제 행 없는 예약 정리는 최근 N시간 안에 만들어진 것만 대상 - 이 기능 도입 전 예약/시드 데이터 보호
	private static final int ORPHAN_LOOKBACK_HOURS = 24;

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

	@Scheduled(fixedRate = 600_000) // 10분마다
	public void cancelStalePendingCardPayments() {
		try {
			paymentService.cancelStalePendingCardPayments(CARD_GRACE_MINUTES);
		} catch (Exception e) {
			log.error("카드결제 이탈 자동취소 배치 실행 중 오류", e);
		}
		// 위 배치는 결제 행이 있는 예약만 찾는다 - 결제 행 없이 남은 예약은 따로 정리(위 배치가 실패해도 이건 실행).
		try {
			paymentService.cancelReservationsWithoutPayment(CARD_GRACE_MINUTES, ORPHAN_LOOKBACK_HOURS);
		} catch (Exception e) {
			log.error("결제 행 없는 예약 자동취소 배치 실행 중 오류", e);
		}
	}
}
