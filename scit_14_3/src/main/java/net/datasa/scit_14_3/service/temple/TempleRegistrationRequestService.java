package net.datasa.scit_14_3.service.temple;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.templeRequest.TempleRegistrationRequestDto;
import net.datasa.scit_14_3.domain.entity.templeRequest.TempleRegistrationRequestEntity;
import net.datasa.scit_14_3.repository.temple.TempleRegistrationRequestRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TempleRegistrationRequestService {

	private final TempleRegistrationRequestRepository requestRepository;
	private final TempleRepository templeRepository;
	private final TempleStayAllowList allowList;

	/** 공개 문의 폼에서 제출. requestId/status/approvedTempleId는 클라이언트 값을 안 믿고 여기서 확정함.
	    이름은 템플스테이 허용 목록에 있는 사찰만, 그리고 이미 등록됐거나 대기중인 사찰은 다시 받지 않음. */
	public TempleRegistrationRequestDto submit(TempleRegistrationRequestDto dto) {
		if (!allowList.matches(dto.getName())) {
			throw new IllegalStateException("템플스테이가 있는 사찰만 등록 가능합니다.");
		}
		if (templeRepository.existsByName(dto.getName())) {
			throw new IllegalStateException("이미 등록되어 있는 사찰입니다.");
		}
		if (requestRepository.existsByNameAndStatus(dto.getName(), TempleRegistrationRequestEntity.Status.대기)) {
			throw new IllegalStateException("이미 접수되어 검토 대기중인 요청입니다.");
		}

		TempleRegistrationRequestEntity entity = TempleRegistrationRequestEntity.builder()
				.name(dto.getName())
				.imageUrl(dto.getImageUrl())
				.latitude(dto.getLatitude())
				.longitude(dto.getLongitude())
				.address(dto.getAddress())
				.region(dto.getRegion())
				.supportSea(dto.isSupportSea())
				.supportMountain(dto.isSupportMountain())
				.supportRiver(dto.isSupportRiver())
				.supportUrban(dto.isSupportUrban())
				.supportEnglish(dto.isSupportEnglish())
				.specialNotice(dto.getSpecialNotice())
				.contactEmail(dto.getContactEmail())
				.build();

		TempleRegistrationRequestEntity saved = requestRepository.save(entity);
		dto.setRequestId(saved.getRequestId());
		dto.setStatus(saved.getStatus());
		return dto;
	}

	public List<TempleRegistrationRequestDto> getAll() {
		List<TempleRegistrationRequestDto> result = new ArrayList<>();
		for (TempleRegistrationRequestEntity entity : requestRepository.findAll()) {
			result.add(toDto(entity));
		}
		return result;
	}

	/** 요청 목록 화면 전용 - 승인된 요청은 이제 "사찰관리" 탭에서 실제 사찰로 보이니
	    여기서는 검토가 필요한 대기 상태만 보여줌(중복 노출 방지). */
	public List<TempleRegistrationRequestDto> getPending() {
		List<TempleRegistrationRequestDto> result = new ArrayList<>();
		for (TempleRegistrationRequestEntity entity : requestRepository.findByStatus(TempleRegistrationRequestEntity.Status.대기)) {
			result.add(toDto(entity));
		}
		return result;
	}

	/** 헤더 드롭다운 알림 점 용도. */
	public long getPendingCount() {
		return requestRepository.countByStatus(TempleRegistrationRequestEntity.Status.대기);
	}

	public TempleRegistrationRequestDto getInfo(Long requestId) {
		TempleRegistrationRequestEntity entity = requestRepository.findById(requestId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 요청이 존재하지 않습니다."));
		return toDto(entity);
	}

	public void markApproved(Long requestId, Long approvedTempleId) {
		TempleRegistrationRequestEntity entity = requestRepository.findById(requestId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 요청이 존재하지 않습니다."));
		entity.setStatus(TempleRegistrationRequestEntity.Status.승인);
		entity.setApprovedTempleId(approvedTempleId);
		requestRepository.save(entity);
	}

	private TempleRegistrationRequestDto toDto(TempleRegistrationRequestEntity entity) {
		return TempleRegistrationRequestDto.builder()
				.requestId(entity.getRequestId())
				.name(entity.getName())
				.imageUrl(entity.getImageUrl())
				.latitude(entity.getLatitude())
				.longitude(entity.getLongitude())
				.address(entity.getAddress())
				.region(entity.getRegion())
				.supportSea(entity.isSupportSea())
				.supportMountain(entity.isSupportMountain())
				.supportRiver(entity.isSupportRiver())
				.supportUrban(entity.isSupportUrban())
				.supportEnglish(entity.isSupportEnglish())
				.specialNotice(entity.getSpecialNotice())
				.contactEmail(entity.getContactEmail())
				.status(entity.getStatus())
				.approvedTempleId(entity.getApprovedTempleId())
				.createdAt(entity.getCreatedAt())
				.build();
	}
}
