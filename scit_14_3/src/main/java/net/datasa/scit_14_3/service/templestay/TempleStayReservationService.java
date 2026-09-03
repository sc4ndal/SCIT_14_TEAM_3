package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import net.datasa.scit_14_3.repository.templestay.TempleStayProgramRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayReservationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayReservationService {
	private final TempleStayReservationRepository tsrr;
	private final TempleStayProgramRepository tspr;
	
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
	
	/**
	 * 템플스테이 프로그램 예약 생성.
	 * 사찰 관리자의 승인 절차 없이 선착순으로 바로 확정한다(예약대기 단계 없음 - 관리자가 임의로
	 * 받을 사람을 고를 수 있으면 불공정하다고 판단). 동시에 여러 명이 마지막 자리를 신청해도 한 명만
	 * 통과하도록 프로그램 행에 락을 걸고 정원을 확인한 뒤 같은 트랜잭션에서 예약을 저장한다.
	 * @param dto
	 * @return
	 */
	public TempleStayReservationDTO reserved(TempleStayReservationDTO dto) {

		TempleStayProgramEntity program = tspr.findByIdForUpdate(dto.getProgramId())
				.orElseThrow(() -> new EntityNotFoundException("해당되는 프로그램이 존재하지 않습니다."));

		int alreadyReserved = tsrr.sumActiveParticipantCount(dto.getProgramId(), TempleStayReservationEntity.Status.취소);
		if (alreadyReserved + dto.getParticipantCount() > program.getMaxParticipant()) {
			throw new IllegalStateException("정원이 모두 찼습니다.");
		}

		TempleStayReservationEntity entity = TempleStayReservationEntity
				.builder()
				.loginId(dto.getLoginId())
				.programId(dto.getProgramId())
				.startDate(dto.getStartDate())
				.endDate(dto.getEndDate())
				.participantCount(dto.getParticipantCount())
				.note(dto.getNote())
				.status(TempleStayReservationEntity.Status.예약확정)
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
	
	/**
	 * 회원의 템플스테이 예약 목록
	 * @param loginId
	 * @return
	 */
	public List<TempleStayReservationDTO> findByMyReservation(String loginId) {
		List<TempleStayReservationDTO> dtoList = new ArrayList<>();
		List<TempleStayReservationEntity> list = tsrr.findByLoginId(loginId);
		
		for(TempleStayReservationEntity entity : list) {
			TempleStayReservationDTO dto = TempleStayReservationDTO.builder()
					.reservationId(entity.getReservationId())
					.loginId(entity.getLoginId())
					.programId(entity.getProgramId())
					.startDate(entity.getStartDate())
					.endDate(entity.getEndDate())
					.participantCount(entity.getParticipantCount())
					.note(entity.getNote())
					.status(entity.getStatus())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}
	public TempleStayReservationDTO canceledMyReservation(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId).orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		
		LocalDateTime checkIn = entity.getStartDate().atStartOfDay();
		if (LocalDateTime.now().isAfter(checkIn.minusHours(24))) {
			throw new IllegalStateException("체크인 24시간 전까지만 취소할 수 있습니다.");
		}
		
		entity.setStatus(TempleStayReservationEntity.Status.취소);

		return TempleStayReservationDTO.builder()
				.reservationId(entity.getReservationId())
				.loginId(entity.getLoginId())
				.programId(entity.getProgramId())
				.startDate(entity.getStartDate())
				.endDate(entity.getEndDate())
				.participantCount(entity.getParticipantCount())
				.note(entity.getNote())
				.status(entity.getStatus())
				.build();
	}

	/**
	 * 결제 실패/취소로 인한 자동 취소 - 사용자가 직접 누른 취소가 아니라서 24시간 컷오프 규칙을
	 * 적용하지 않는다(결제가 안 됐으니 자리를 바로 비워줘야 다른 사람이 예약할 수 있음).
	 */
	public void cancelUnpaid(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		entity.setStatus(TempleStayReservationEntity.Status.취소);
	}
	}

