package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.FavoriteReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FavoriteReviewRepository extends JpaRepository<FavoriteReviewEntity, Long> {

	Optional<FavoriteReviewEntity> findByLoginIdAndReview_ReviewId(String loginId, Long reviewId);

	// FavoriteReviewEntity.review가 @ManyToOne(기본 EAGER)이라 JOIN FETCH 없이 쓰면 좋아요
	// 건수만큼 TEMPLE_STAY_REVIEW를 따로 불러옴(N+1) - TempleStayReviewService.getFavoriteReviews()가
	// 바로 이어서 review를 꺼내 쓴다.
	@Query("select f from FavoriteReviewEntity f join fetch f.review where f.loginId = :loginId order by f.createdAt desc")
	List<FavoriteReviewEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	// 마이페이지 허브 카드의 "좋아요한 리뷰 N건" 배지용
	long countByLoginId(String loginId);

	// 목록 화면에서 좋아요 여부 표시용 - 매번 exists 쿼리를 여러 번 날리지 않도록 한 번에 review_id만 뽑아둠
	@Query("SELECT f.review.reviewId FROM FavoriteReviewEntity f WHERE f.loginId = :loginId")
	Set<Long> findFavoritedReviewIds(String loginId);
}
