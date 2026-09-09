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

	// 사찰 프로그램 관리 > 상세보기에서 이 프로그램에 걸린 예약들을 볼 때 씀
	List<TempleStayReservationEntity> findByProgramIdOrderByStartDateAsc(Long programId);

	// 취소되지 않은 예약들의 참가 인원 합 - 정원 초과 여부 판단용
	@Query("select coalesce(sum(r.participantCount), 0) from TempleStayReservationEntity r " +
			"where r.programId = :programId and r.status <> :canceled")
	int sumActiveParticipantCount(@Param("programId") Long programId,
	                               @Param("canceled") TempleStayReservationEntity.Status canceled);

	// sumActiveParticipantCount를 프로그램마다 반복 호출하면 목록 조회가 N+1이 돼서 느려짐 -
	// 목록 화면(getAll/getByTemple)에서는 이걸로 한 번에 프로그램별 합계를 묶어서 가져온다.
	// Object[] = { programId(Long), sum(Long) }
	@Query("select r.programId, coalesce(sum(r.participantCount), 0) from TempleStayReservationEntity r " +
			"where r.status <> :canceled group by r.programId")
	List<Object[]> sumActiveParticipantCountGroupedByProgram(@Param("canceled") TempleStayReservationEntity.Status canceled);
}
