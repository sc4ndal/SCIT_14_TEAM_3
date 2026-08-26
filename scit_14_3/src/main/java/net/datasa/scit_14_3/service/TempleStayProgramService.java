package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.domain.dto.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.entity.TempleEntity;
import net.datasa.scit_14_3.domain.entity.TempleStayProgramEntity;
import net.datasa.scit_14_3.repository.TempleStayProgramRepository;
import org.springframework.stereotype.Service;

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
				.description(entity.getDescription())
				.schedule(entity.getSchedule())
				.requiredItems(entity.getRequiredItems())
				.refundPolicy(entity.getRefundPolicy())
				.precautions(entity.getPrecautions())
				.price(entity.getPrice())
				.duration(entity.getDuration())
				.maxParticipant(entity.getMaxParticipant())
				.supportEnglish(entity.isSupportEnglish())
				.createdAt(entity.getCreatedAt())
				.build();
	}
}
