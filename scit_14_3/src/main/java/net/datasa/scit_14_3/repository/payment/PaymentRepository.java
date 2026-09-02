package net.datasa.scit_14_3.repository.payment;

import net.datasa.scit_14_3.domain.entity.payment.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
	Optional<PaymentEntity> findByReservationId(Long reservationId);
}
