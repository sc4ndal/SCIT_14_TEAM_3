package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempleStayReservationRepository extends JpaRepository<TempleStayReservationEntity, Long> {
	List<TempleStayReservationEntity> findByLoginId(String loginId);
}
