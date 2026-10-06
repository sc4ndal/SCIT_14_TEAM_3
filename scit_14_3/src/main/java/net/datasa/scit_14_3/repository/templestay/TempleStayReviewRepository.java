package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleStayReviewRepository extends JpaRepository<TempleStayReviewEntity, Long> {
	// 예약 1건당 리뷰 1개 (DB에도 UNIQUE 제약 있음) - 중복 작성 체크 및 상세조회용
	Optional<TempleStayReviewEntity> findByReservationId(Long reservationId);

	// 마이페이지 > 내가 쓴 리뷰
	List<TempleStayReviewEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	// 마이페이지 허브 카드의 "리뷰 N건" 배지용
	long countByLoginId(String loginId);

	// 회원 삭제 시 그 회원의 리뷰를 "탈퇴한 회원" 전용 계정으로 넘긴다 - UserService.erase 참고
	@org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update TempleStayReviewEntity r set r.loginId = :to where r.loginId = :from")
	int reassignOwner(@Param("from") String from, @Param("to") String to);

	// 좋아요 행(FAVORITE_REVIEW)이 바뀐 리뷰의 like_count를 남아 있는 좋아요 행 수로 다시 맞춘다 - 회원 삭제로 그 회원의 좋아요 행을
	// 지운 뒤 호출한다. like_count는 따로 저장된 숫자라 행만 지우면 어긋나는데, 줄이는 방식(-1)이 아니라 행을 세어 덮어쓰므로 이미 어긋나 있던 값도 바로잡힌다.
	@org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update TempleStayReviewEntity r set r.likeCount = cast((select count(f) from FavoriteReviewEntity f where f.review.reviewId = r.reviewId) as integer) " +
			"where r.reviewId in :ids")
	int refreshLikeCounts(@Param("ids") java.util.Collection<Long> ids);

	// 전체 후기 모아보기 (/reservation/reviews) - 최신순
	List<TempleStayReviewEntity> findAllByOrderByCreatedAtDesc();

	// 사찰 평균 평점 + 리뷰 건수 재계산용 - REVIEW에는 temple_id가 없어서 RESERVATION->PROGRAM을
	// 거쳐야 사찰을 찾을 수 있다. 셋 다 연관관계(@ManyToOne)로 안 묶여있어 JOIN FETCH 대신 콤마
	// 조인 + WHERE로 조건을 건다(표준 JPQL 문법).
	// 평점/건수를 Object[] 하나로 같이 받으려 했다가 Spring Data JPA가 집계 2개짜리 단일행
	// 결과를 Object[] 반환타입으로 잘못 풀어서(List<Object[]> 한 줄짜리를 그대로 toArray() 해버려서
	// stats[0]에 숫자가 아니라 행 전체가 들어가는) ClassCastException이 났다 - 쿼리를 scalar
	// 반환 2개로 쪼개서 그 문제 자체를 없앴다(왕복은 늘지만 호출 빈도가 낮아 무시 가능).
	@Query("select avg(r.rating) from TempleStayReviewEntity r, TempleStayReservationEntity res, TempleStayProgramEntity p " +
			"where r.reservationId = res.reservationId and res.programId = p.programId and p.temple.templeId = :templeId")
	Double findAverageRatingByTempleId(@Param("templeId") Long templeId);

	@Query("select count(r) from TempleStayReviewEntity r, TempleStayReservationEntity res, TempleStayProgramEntity p " +
			"where r.reservationId = res.reservationId and res.programId = p.programId and p.temple.templeId = :templeId")
	long countReviewsByTempleId(@Param("templeId") Long templeId);
}
