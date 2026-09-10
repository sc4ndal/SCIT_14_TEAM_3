package net.datasa.scit_14_3.repository.templestay;

import jakarta.persistence.LockModeType;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleStayProgramRepository extends JpaRepository<TempleStayProgramEntity,Long> {
	// TempleStayProgramEntity.temple이 @ManyToOne(기본 EAGER)이라 findAll()을 그냥 쓰면
	// row마다 TEMPLE을 별도 쿼리로 불러옴(N+1) - 로컬은 왕복이 거의 0이라 안 보였지만
	// 원격 DB(Aiven)에서는 이게 그대로 수백 번의 네트워크 왕복이 되어 체감 지연의 원인이었다.
	// JOIN FETCH로 한 번에 같이 가져온다.
	@Query("select p from TempleStayProgramEntity p join fetch p.temple")
	List<TempleStayProgramEntity> findAllWithTemple();

	@Query("select p from TempleStayProgramEntity p join fetch p.temple where p.temple.templeId = :templeId")
	List<TempleStayProgramEntity> findByTemple_TempleIdWithTemple(@Param("templeId") Long templeId);

	List<TempleStayProgramEntity> findByTemple_TempleId(Long templeId);
	// 수정/삭제 시 남의 사찰 프로그램을 programId만 바꿔서 건드리지 못하도록 소유 사찰까지 같이 확인
	Optional<TempleStayProgramEntity> findByProgramIdAndTemple_TempleId(Long programId, Long templeId);

	// 예약 정원 체크용 - 동시에 여러 명이 마지막 자리를 두고 예약 신청해도 한 명씩만 통과하도록
	// 이 행에 DB 락을 걸고 정원 확인 + 예약 insert까지 같은 트랜잭션에서 처리함(TempleStayReservationService.reserved 참고).
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from TempleStayProgramEntity p where p.programId = :programId")
	Optional<TempleStayProgramEntity> findByIdForUpdate(@Param("programId") Long programId);
}
