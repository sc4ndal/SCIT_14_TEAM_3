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
		// DB 컬럼 길이(이름 50 / 이메일 100 / 전화 20)를 넘으면 저장 시점에 500으로 터지므로, 미리 확인해서
		// 이유가 담긴 메시지로 돌려준다(컨트롤러가 IllegalStateException을 409로 변환).
		for (ReservationParticipantDTO dto : reservationParticipantDTO) {
			if (dto.getName() != null && dto.getName().length() > 50) {
				throw new IllegalStateException("참가자 이름은 50자 이하로 입력해 주세요.");
			}
			if (dto.getEmail() != null && dto.getEmail().length() > 100) {
				throw new IllegalStateException("참가자 이메일은 100자 이하로 입력해 주세요.");
			}
			if (dto.getPhone() != null && dto.getPhone().length() > 20) {
				throw new IllegalStateException("전화번호는 20자 이하로 입력해 주세요.");
			}
		}

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
