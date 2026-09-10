package net.datasa.scit_14_3.repository.inquiry;

import net.datasa.scit_14_3.domain.entity.inquiry.InquiryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<InquiryEntity, Long> {
	List<InquiryEntity> findByLoginIdOrderByCreatedAtDesc(String loginId);

	List<InquiryEntity> findAllByOrderByStatusAscCreatedAtDesc();

	long countByStatus(InquiryEntity.Status status);
}
