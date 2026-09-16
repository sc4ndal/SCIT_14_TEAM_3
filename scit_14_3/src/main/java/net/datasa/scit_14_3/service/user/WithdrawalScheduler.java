package net.datasa.scit_14_3.service.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 탈퇴 신청 후 유예기간(30일)이 지난 회원을 매일 찾아 확정(익명화) 처리한다.
 * 실제 로직은 UserService.finalizeOverdueWithdrawals() 참고.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WithdrawalScheduler {

	private final UserService userService;

	@Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
	public void finalizeOverdueWithdrawals() {
		try {
			userService.finalizeOverdueWithdrawals();
		} catch (Exception e) {
			log.error("탈퇴 확정 처리 배치 실행 중 오류", e);
		}
	}
}
