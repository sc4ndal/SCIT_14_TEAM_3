package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.FavoriteTempleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteTempleRepository extends JpaRepository<FavoriteTempleEntity, Long> {
	// 유저가 이 사찰을 이미 즐겨찾기 했는지 확인(별표 초기 상태 표시용)
	boolean existsByLoginIdAndTemple_TempleId(String loginId, Long templeId);
	// 유저가 즐겨찾기한 사찰을 마이페이지에 리스트 나열
	List<FavoriteTempleEntity> findByLoginId(String loginId);
	// 유저가 즐겨찾기한 사찰을 취소하기
	void deleteByLoginIdAndTemple_TempleId(String loginId, Long templeId);
}