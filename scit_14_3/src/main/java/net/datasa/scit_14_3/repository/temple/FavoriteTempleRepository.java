package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.FavoriteTempleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface FavoriteTempleRepository extends JpaRepository<FavoriteTempleEntity, Long> {
	// 유저가 이 사찰을 이미 즐겨찾기 했는지 확인(별표 초기 상태 표시용)
	boolean existsByLoginIdAndTemple_TempleId(String loginId, Long templeId);
	// 유저가 즐겨찾기한 사찰을 마이페이지에 리스트 나열
	List<FavoriteTempleEntity> findByLoginId(String loginId);
	// 유저가 즐겨찾기한 사찰을 취소하기
	void deleteByLoginIdAndTemple_TempleId(String loginId, Long templeId);

	// 지도/목록 화면에서 사찰마다 즐겨찾기 여부 표시용 - 매번 exists 쿼리를 여러 번 날리지 않도록 한 번에 temple_id만 뽑아둠
	@Query("SELECT f.temple.templeId FROM FavoriteTempleEntity f WHERE f.loginId = :loginId")
	Set<Long> findFavoritedTempleIds(String loginId);
}