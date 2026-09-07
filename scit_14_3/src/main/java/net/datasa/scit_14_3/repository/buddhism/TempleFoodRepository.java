package net.datasa.scit_14_3.repository.buddhism;

import net.datasa.scit_14_3.domain.entity.buddhism.TempleFoodEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TempleFoodRepository extends JpaRepository<TempleFoodEntity, Long> {

	List<TempleFoodEntity> findAllByOrderByRecommendationIdAsc();
}
