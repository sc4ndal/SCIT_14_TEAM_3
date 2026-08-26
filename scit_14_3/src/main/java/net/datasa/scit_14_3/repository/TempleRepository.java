package net.datasa.scit_14_3.repository;

import net.datasa.scit_14_3.domain.entity.TempleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TempleRepository extends JpaRepository<TempleEntity, Long> {
}
