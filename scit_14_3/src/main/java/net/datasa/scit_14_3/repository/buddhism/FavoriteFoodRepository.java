package net.datasa.scit_14_3.repository.buddhism;

import net.datasa.scit_14_3.domain.entity.buddhism.FavoriteFoodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FavoriteFoodRepository extends JpaRepository<FavoriteFoodEntity, Long> {

	Optional<FavoriteFoodEntity> findByLoginIdAndFood_RecommendationId(String loginId, Long recommendationId);

	// FavoriteFoodEntity.food가 @ManyToOne(기본 EAGER)이라 JOIN FETCH 없이 쓰면 즐겨찾기
	// 건수만큼 TEMPLE_FOOD_RECOMMENDATION을 따로 불러옴(N+1)
	@Query("select f from FavoriteFoodEntity f join fetch f.food where f.loginId = :loginId order by f.createdAt desc")
	List<FavoriteFoodEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	// 마이페이지 허브 카드의 "관심 사찰음식 N개" 배지용
	long countByLoginId(String loginId);

	// 목록 화면에서 즐겨찾기 여부 표시용 - 매번 exists 쿼리를 여러 번 날리지 않도록 한 번에 recommendation_id만 뽑아둠
	@Query("SELECT f.food.recommendationId FROM FavoriteFoodEntity f WHERE f.loginId = :loginId")
	Set<Long> findFavoritedFoodIds(String loginId);
}
