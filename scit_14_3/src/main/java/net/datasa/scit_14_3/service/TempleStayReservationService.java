package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.TempleStayReservationEntity;
import net.datasa.scit_14_3.repository.TempleStayReservationRepository;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayReservationService {
	private final TempleStayReservationRepository tsrr;
	
	public TempleStayReservationDTO getInfo(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		
		return TempleStayReservationDTO.builder()
				.reservationId(entity.getReservationId())
				.loginId(entity.getLoginId())
				.programId(entity.getProgramId())
				.startDate(entity.getStartDate())
				.endDate(entity.getEndDate())
				.participantCount(entity.getParticipantCount())
				.note(entity.getNote())
				.status(entity.getStatus())
				.canceledAt(entity.getCanceledAt())
				.createdAt(entity.getCreatedAt())
				.build();
	}
	
	public TempleStayReservationDTO reserved(TempleStayReservationDTO dto) {
		
		TempleStayReservationEntity entity = TempleStayReservationEntity
				.builder()
				.loginId(dto.getLoginId())
				.programId(dto.getProgramId())
				.startDate(dto.getStartDate())
				.endDate(dto.getEndDate())
				.participantCount(dto.getParticipantCount())
				.note(dto.getNote())
				.status(TempleStayReservationEntity.Status.예약대기)
				.build();
		
		TempleStayReservationEntity saved = tsrr.save(entity);
		
		return TempleStayReservationDTO.builder()
				.reservationId(saved.getReservationId())
				.loginId(saved.getLoginId())
				.programId(saved.getProgramId())
				.startDate(saved.getStartDate())
				.endDate(saved.getEndDate())
				.participantCount(saved.getParticipantCount())
				.note(saved.getNote())
				.status(saved.getStatus())
				.build();
	}
	}

