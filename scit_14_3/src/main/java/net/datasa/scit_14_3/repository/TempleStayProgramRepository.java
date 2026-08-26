package net.datasa.scit_14_3.repository;

import net.datasa.scit_14_3.domain.entity.TempleStayProgramEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TempleStayProgramRepository extends JpaRepository<TempleStayProgramEntity,Long> {
}
