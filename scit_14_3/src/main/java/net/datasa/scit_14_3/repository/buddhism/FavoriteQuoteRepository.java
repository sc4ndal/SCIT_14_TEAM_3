package net.datasa.scit_14_3.repository.buddhism;

import net.datasa.scit_14_3.domain.entity.buddhism.FavoriteQuoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FavoriteQuoteRepository extends JpaRepository<FavoriteQuoteEntity, Long> {

	Optional<FavoriteQuoteEntity> findByLoginIdAndQuote_QuoteId(String loginId, Long quoteId);

	List<FavoriteQuoteEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	// 목록 화면에서 즐겨찾기 여부 표시용 - 매번 exists 쿼리를 여러 번 날리지 않도록 한 번에 quote_id만 뽑아둠
	@Query("SELECT f.quote.quoteId FROM FavoriteQuoteEntity f WHERE f.loginId = :loginId")
	Set<Long> findFavoritedQuoteIds(String loginId);
}
