package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.entity.ReservationParticipantEntity;
import net.datasa.scit_14_3.repository.ReservationParticipantRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ReservationParticipantService {
	private final ReservationParticipantRepository rpr;
	
	public ReservationParticipantDTO getInfo(Long participantId) {
		ReservationParticipantEntity entity = rpr.findById(participantId).orElseThrow(()-> new EntityNotFoundException("해당 데이터가 존재하지 않습니다."));
		
		return ReservationParticipantDTO.builder()
				.participantId(entity.getParticipantId())
				.reservationId(entity.getReservationId())
				.name(entity.getName())
				.gender(entity.getGender())
				.email(entity.getEmail())
				.build();
	}
}
