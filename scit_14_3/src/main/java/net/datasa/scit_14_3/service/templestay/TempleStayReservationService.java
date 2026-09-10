package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.ProgramReservationDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import net.datasa.scit_14_3.repository.templestay.ReservationParticipantRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayProgramRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayReservationRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
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
	private final ReservationParticipantRepository rpr;
	private final UserRepository userRepository;
	
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
	@CacheEvict(value = {"programs", "programsByTemple"}, allEntries = true)
	public TempleStayReservationDTO reserved(TempleStayReservationDTO dto) {

		// login_id가 USER(회원) 테이블을 FK로 참조해서, 사찰/관리자 계정으로 예약을 시도하면
		// 저장 시점에 FK 위반으로 죽어 "신청 실패"만 뜨고 이유를 알 수 없었다 - 여기서 미리 막아서
		// 이유가 담긴 메시지로 내려준다(컨트롤러가 IllegalStateException을 409로 변환해서 alert로 보여줌).
		if (!userRepository.existsById(dto.getLoginId())) {
			throw new IllegalStateException("회원 계정으로만 예약할 수 있습니다. 사찰/관리자 계정은 예약할 수 없습니다.");
		}

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
					.createdAt(entity.getCreatedAt())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}
	@CacheEvict(value = {"programs", "programsByTemple"}, allEntries = true)
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
	@CacheEvict(value = {"programs", "programsByTemple"}, allEntries = true)
	public void cancelUnpaid(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		entity.setStatus(TempleStayReservationEntity.Status.취소);
	}

	/**
	 * 사찰 관리자가 자기 사찰 프로그램에 걸린 예약을 직접 취소.
	 * 이용자 취소(canceledMyReservation)와 달리 24시간 컷오프를 적용하지 않는다 - 운영자가
	 * 판단해서 취소하는 것이라 이용자 보호용 규칙을 그대로 적용할 필요가 없음.
	 * 대신 이 예약이 진짜 본인 사찰 소속 프로그램인지는 반드시 확인한다(programId만 바꿔서
	 * 남의 사찰 예약을 취소하지 못하도록).
	 */
	@CacheEvict(value = {"programs", "programsByTemple"}, allEntries = true)
	public void cancelByTempleAdmin(Long reservationId, Long templeId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 예약이 존재하지 않습니다."));
		TempleStayProgramEntity program = tspr.findById(entity.getProgramId())
				.orElseThrow(() -> new EntityNotFoundException("해당되는 프로그램이 존재하지 않습니다."));

		if (!program.getTemple().getTempleId().equals(templeId)) {
			throw new IllegalStateException("본인 사찰의 예약만 취소할 수 있습니다.");
		}
		if (entity.getStatus() == TempleStayReservationEntity.Status.취소) {
			throw new IllegalStateException("이미 취소된 예약입니다.");
		}
		entity.setStatus(TempleStayReservationEntity.Status.취소);
	}

	/** 사찰 프로그램 관리 > 상세보기 - 이 프로그램에 걸린 예약들을 대표자 인적사항과 함께 보여줌. */
	public List<ProgramReservationDTO> getByProgramId(Long programId) {
		List<ProgramReservationDTO> result = new ArrayList<>();
		for (TempleStayReservationEntity r : tsrr.findByProgramIdOrderByStartDateAsc(programId)) {
			ReservationParticipantEntity representative =
					rpr.findFirstByReservationIdOrderByParticipantIdAsc(r.getReservationId()).orElse(null);
			result.add(ProgramReservationDTO.builder()
					.reservationId(r.getReservationId())
					.representativeName(representative != null ? representative.getName() : "-")
					.representativeEmail(representative != null ? representative.getEmail() : "-")
					.representativePhone(representative != null ? representative.getPhone() : "-")
					.participantCount(r.getParticipantCount())
					.startDate(r.getStartDate())
					.endDate(r.getEndDate())
					.status(r.getStatus())
					.createdAt(r.getCreatedAt())
					.build());
		}
		return result;
	}
	}

