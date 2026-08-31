package net.datasa.scit_14_3.repository;

import net.datasa.scit_14_3.domain.entity.BuddhismInfoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuddhismInfoRepository extends JpaRepository<BuddhismInfoEntity, Long> {

	List<BuddhismInfoEntity> findByCategoryOrderByPostIdAsc(String category);

	List<BuddhismInfoEntity> findAllByOrderByPostIdAsc();
}
