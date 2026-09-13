package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.TempleEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TempleEventRepository extends JpaRepository<TempleEventEntity, Long> {

	List<TempleEventEntity> findAllByOrderByStartDateAsc();
}
