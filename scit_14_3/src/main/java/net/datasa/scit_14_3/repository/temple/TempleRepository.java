package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleRepository extends JpaRepository<TempleEntity, Long> {
	Optional<TempleEntity> findByLoginId(String loginId);
	boolean existsByLoginId(String loginId);
	boolean existsByName(String name);
}