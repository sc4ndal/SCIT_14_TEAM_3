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

	// 예약 여러 건의 대표자를 한 번에 찾을 때(TempleStayReservationService.getByProgramId) 쓴다 -
	// 예약마다 findFirstBy...를 반복 호출하면 N+1이라, 관련 참가자 전체를 한 번에 가져온 뒤
	// 호출부에서 예약별로 묶어서 맨 처음 등록된 사람만 골라 쓴다.
	List<ReservationParticipantEntity> findByReservationIdInOrderByParticipantIdAsc(List<Long> reservationIds);
}
