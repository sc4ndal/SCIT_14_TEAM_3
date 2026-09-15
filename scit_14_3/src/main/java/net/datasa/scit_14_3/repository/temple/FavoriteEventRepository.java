package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.FavoriteEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FavoriteEventRepository extends JpaRepository<FavoriteEventEntity, Long> {

	Optional<FavoriteEventEntity> findByLoginIdAndEvent_EventId(String loginId, Long eventId);

	List<FavoriteEventEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	// 목록 화면에서 즐겨찾기 여부 표시용 - 매번 exists 쿼리를 여러 번 날리지 않도록 한 번에 event_id만 뽑아둠
	@Query("SELECT f.event.eventId FROM FavoriteEventEntity f WHERE f.loginId = :loginId")
	Set<Long> findFavoritedEventIds(String loginId);
}
