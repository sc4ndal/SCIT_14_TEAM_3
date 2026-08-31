package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.entity.TempleStayProgramEntity;
import net.datasa.scit_14_3.repository.TempleStayProgramRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayProgramService {
	private final TempleStayProgramRepository tspr;
	
	public TempleStayProgramDTO getInfo(Long programId) {
		TempleStayProgramEntity entity = tspr.findById(programId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		
		return TempleStayProgramDTO.builder()
				.programId(entity.getProgramId())
				.templeId(entity.getTempleId())
				.title(entity.getTitle())
				.programType(entity.getProgramType())
				.imageUrl(entity.getImageUrl())
				.description(entity.getDescription())
				.schedule(entity.getSchedule())
				.requiredItems(entity.getRequiredItems())
				.refundPolicy(entity.getRefundPolicy())
				.precautions(entity.getPrecautions())
				.price(entity.getPrice())
				.duration(entity.getDuration())
				.maxParticipant(entity.getMaxParticipant())
				.supportEnglish(entity.isSupportEnglish())
				.latitude(entity.getLatitude())
				.longitude(entity.getLongitude())
				.createdAt(entity.getCreatedAt())
				.build();
	}

	public List<TempleStayProgramDTO> getAll() {
		List<TempleStayProgramDTO> dtoList = new ArrayList<>();
		List<TempleStayProgramEntity> list = tspr.findAll();
		
		for(TempleStayProgramEntity entity : list) {
			TempleStayProgramDTO dto = TempleStayProgramDTO.builder()
					.programId(entity.getProgramId())
					.templeId(entity.getTempleId())
					.title(entity.getTitle())
					.programType(entity.getProgramType())
					.imageUrl(entity.getImageUrl())
					.description(entity.getDescription())
					.schedule(entity.getSchedule())
					.requiredItems(entity.getRequiredItems())
					.refundPolicy(entity.getRefundPolicy())
					.precautions(entity.getPrecautions())
					.price(entity.getPrice())
					.duration(entity.getDuration())
					.maxParticipant(entity.getMaxParticipant())
					.supportEnglish(entity.isSupportEnglish())
					.latitude(entity.getLatitude())
					.longitude(entity.getLongitude())
					.createdAt(entity.getCreatedAt())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}
}
