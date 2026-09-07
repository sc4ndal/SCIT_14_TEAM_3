package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationParticipantRepository extends JpaRepository<ReservationParticipantEntity, Long> {
	List<ReservationParticipantEntity> findByReservationId(Long reservationId);

	// 참가자 목록 중 맨 처음 등록된 사람 = 예약 신청 대표자(reservation.js에서 participants[0]로 같이 저장함)
	Optional<ReservationParticipantEntity> findFirstByReservationIdOrderByParticipantIdAsc(Long reservationId);
}
