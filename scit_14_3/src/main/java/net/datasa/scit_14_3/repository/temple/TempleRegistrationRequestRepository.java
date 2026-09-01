package net.datasa.scit_14_3.repository.temple;

import net.datasa.scit_14_3.domain.entity.templeRequest.TempleRegistrationRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempleRegistrationRequestRepository extends JpaRepository<TempleRegistrationRequestEntity, Long> {
	List<TempleRegistrationRequestEntity> findByStatus(TempleRegistrationRequestEntity.Status status);

	// 사찰 삭제 전에 이 사찰을 승인 생성했던 과거 요청 기록을 찾아서 approved_temple_id 연결만 끊는 데 씀
	List<TempleRegistrationRequestEntity> findByApprovedTempleId(Long approvedTempleId);

	long countByStatus(TempleRegistrationRequestEntity.Status status);

	// 같은 이름으로 이미 접수돼서 대기중인 요청이 또 있는지 확인 (중복 등록 방지)
	boolean existsByNameAndStatus(String name, TempleRegistrationRequestEntity.Status status);
}
