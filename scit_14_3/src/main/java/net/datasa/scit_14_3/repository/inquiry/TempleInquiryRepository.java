package net.datasa.scit_14_3.repository.inquiry;

import net.datasa.scit_14_3.domain.entity.inquiry.TempleInquiryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempleInquiryRepository extends JpaRepository<TempleInquiryEntity, Long> {
	List<TempleInquiryEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	List<TempleInquiryEntity> findByTempleIdOrderByStatusAscCreatedAtDesc(Long templeId);

	long countByTempleIdAndStatus(Long templeId, TempleInquiryEntity.Status status);
}
