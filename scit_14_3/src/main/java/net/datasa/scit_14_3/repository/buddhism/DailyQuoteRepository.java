package net.datasa.scit_14_3.repository.buddhism;

import net.datasa.scit_14_3.domain.entity.buddhism.DailyQuoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DailyQuoteRepository extends JpaRepository<DailyQuoteEntity, Long> {

	List<DailyQuoteEntity> findAllByOrderByQuoteIdAsc();

	@Query(value = "SELECT * FROM daily_quote ORDER BY RAND() LIMIT 1", nativeQuery = true)
	Optional<DailyQuoteEntity> findRandomOne();
}
