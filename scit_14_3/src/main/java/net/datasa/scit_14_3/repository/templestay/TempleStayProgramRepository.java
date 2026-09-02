package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleStayProgramRepository extends JpaRepository<TempleStayProgramEntity,Long> {
	List<TempleStayProgramEntity> findByTemple_TempleId(Long templeId);
	// 수정/삭제 시 남의 사찰 프로그램을 programId만 바꿔서 건드리지 못하도록 소유 사찰까지 같이 확인
	Optional<TempleStayProgramEntity> findByProgramIdAndTemple_TempleId(Long programId, Long templeId);
}
