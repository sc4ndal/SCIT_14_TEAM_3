package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import net.datasa.scit_14_3.repository.templestay.ReservationParticipantRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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
				.phone(entity.getPhone())
				.build();
	}

	public List<ReservationParticipantDTO> getByReservationId(Long reservationId) {
		List<ReservationParticipantDTO> dtoList = new ArrayList<>();
		for (ReservationParticipantEntity entity : rpr.findByReservationId(reservationId)) {
			dtoList.add(ReservationParticipantDTO.builder()
					.participantId(entity.getParticipantId())
					.reservationId(entity.getReservationId())
					.name(entity.getName())
					.gender(entity.getGender())
					.email(entity.getEmail())
					.phone(entity.getPhone())
					.build());
		}
		return dtoList;
	}

	/**
	 * 참가자 예약 생성
	 * @param reservationParticipantDTO
	 * @return
	 */
	public List<ReservationParticipantDTO> reserved(List<ReservationParticipantDTO> reservationParticipantDTO) {
		List<ReservationParticipantDTO> dtoList = new ArrayList<>();
		
		for(ReservationParticipantDTO dto : reservationParticipantDTO) {
				ReservationParticipantEntity entity = ReservationParticipantEntity.builder()
						.reservationId(dto.getReservationId())
						.name(dto.getName())
						.gender(dto.getGender())
						.email(dto.getEmail())
						.phone(dto.getPhone())
						.build();


		ReservationParticipantEntity saved = rpr.save(entity); // 저장! (여기서 participantId가 새로 생김) 이거 안 만들면 participantId를 알 수 없움

		dtoList.add(ReservationParticipantDTO.builder()
				.participantId(saved.getParticipantId())
				.reservationId(saved.getReservationId())	//사실 dto에서 꺼내나 saved에서 꺼내나 값이 완전히 똑같음
				.name(dto.getName())
				.gender(dto.getGender())
				.email(dto.getEmail())
				.phone(dto.getPhone())
				.build());
	}
		return dtoList;
	}
}
