package net.datasa.scit_14_3.service.templestay;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.templestay.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import net.datasa.scit_14_3.repository.templestay.ReservationParticipantRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ReservationParticipantService {
	private final ReservationParticipantRepository rpr;
	
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
	 * 참가자 예약 생성 - 참가자 수만큼 save()를 따로 부르면 건마다 왕복이 나서(원격 DB일수록 체감 큼)
	 * saveAll()로 한 번에 묶어 보낸다(application.properties의 hibernate.jdbc.batch_size +
	 * datasource url의 rewriteBatchedStatements=true가 실제로 한 번에 묶이게 해줌).
	 */
	public List<ReservationParticipantDTO> reserved(List<ReservationParticipantDTO> reservationParticipantDTO) {
		List<ReservationParticipantEntity> entities = reservationParticipantDTO.stream()
				.map(dto -> ReservationParticipantEntity.builder()
						.reservationId(dto.getReservationId())
						.name(dto.getName())
						.gender(dto.getGender())
						.email(dto.getEmail())
						.phone(dto.getPhone())
						.build())
				.toList();

		return rpr.saveAll(entities).stream() // saveAll()도 participantId가 채워진 엔티티를 순서 그대로 돌려줌
				.map(saved -> ReservationParticipantDTO.builder()
						.participantId(saved.getParticipantId())
						.reservationId(saved.getReservationId())
						.name(saved.getName())
						.gender(saved.getGender())
						.email(saved.getEmail())
						.phone(saved.getPhone())
						.build())
				.toList();
	}
}
