package net.datasa.scit_14_3.repository.payment;

import net.datasa.scit_14_3.domain.entity.payment.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
	Optional<PaymentEntity> findByReservationId(Long reservationId);

	// 예약목록 화면에서 예약마다 결제 정보를 한 건씩 따로 불러오면(N+1) 원격 DB에서 왕복이
	// 쌓여서 느려짐 - 한 번에 묶어서 가져온다.
	List<PaymentEntity> findByReservationIdIn(List<Long> reservationIds);

	// 카드결제 이탈(토스 결제창 띄워놓고 탭 닫기 등) 자동취소 배치용 - PaymentService.cancelStalePendingCardPayments 참고.
	List<PaymentEntity> findByPaymentMethodAndStatusAndCreatedAtBefore(
			PaymentEntity.PaymentMethod paymentMethod, PaymentEntity.Status status, LocalDateTime cutoff);
}
