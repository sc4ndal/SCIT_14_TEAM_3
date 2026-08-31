package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.TempleRegistrationRequestDto;
import net.datasa.scit_14_3.domain.entity.TempleRegistrationRequestEntity;
import net.datasa.scit_14_3.repository.TempleRegistrationRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TempleRegistrationRequestService {

	private final TempleRegistrationRequestRepository requestRepository;

	/** 공개 문의 폼에서 제출. requestId/status/approvedTempleId는 클라이언트 값을 안 믿고 여기서 확정함. */
	public TempleRegistrationRequestDto submit(TempleRegistrationRequestDto dto) {
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
