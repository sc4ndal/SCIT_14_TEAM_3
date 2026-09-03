package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempleStayReservationRepository extends JpaRepository<TempleStayReservationEntity, Long> {
	List<TempleStayReservationEntity> findByLoginId(String loginId);

	// 취소되지 않은 예약들의 참가 인원 합 - 정원 초과 여부 판단용
	@Query("select coalesce(sum(r.participantCount), 0) from TempleStayReservationEntity r " +
			"where r.programId = :programId and r.status <> :canceled")
	int sumActiveParticipantCount(@Param("programId") Long programId,
	                               @Param("canceled") TempleStayReservationEntity.Status canceled);
}
