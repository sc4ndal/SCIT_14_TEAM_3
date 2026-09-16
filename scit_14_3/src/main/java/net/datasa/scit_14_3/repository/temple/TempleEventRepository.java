package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.TempleEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TempleEventRepository extends JpaRepository<TempleEventEntity, Long> {

	// TempleEventEntity.temple이 @ManyToOne(기본 EAGER)이라 findAll()류를 그냥 쓰면 행사 건마다
	// TEMPLE을 별도 쿼리로 불러옴(N+1) - 홈 캘린더/행사 목록은 누구나 보는 공개 화면이라 방문자마다
	// 이 비용을 치르게 됨. JOIN FETCH로 한 번에 가져온다.
	@Query("select e from TempleEventEntity e join fetch e.temple")
	List<TempleEventEntity> findAllWithTemple();
}
