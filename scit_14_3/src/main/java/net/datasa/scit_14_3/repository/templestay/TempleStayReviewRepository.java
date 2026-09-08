package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleStayReviewRepository extends JpaRepository<TempleStayReviewEntity, Long> {
	// 예약 1건당 리뷰 1개 (DB에도 UNIQUE 제약 있음) - 중복 작성 체크 및 상세조회용
	Optional<TempleStayReviewEntity> findByReservationId(Long reservationId);

	// 마이페이지 > 내가 쓴 리뷰
	List<TempleStayReviewEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);
}
