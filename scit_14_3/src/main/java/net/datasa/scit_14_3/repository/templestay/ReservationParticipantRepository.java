package net.datasa.scit_14_3.repository.templestay;

import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservationParticipantRepository extends JpaRepository<ReservationParticipantEntity, Long> {
}
