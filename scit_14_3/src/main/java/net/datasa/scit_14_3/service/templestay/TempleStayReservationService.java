package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayReservationService {
	private final TempleStayReservationRepository tsrr;
	private final TempleStayProgramRepository tspr;
	private final ReservationParticipantRepository rpr;
	private final UserRepository userRepository;
	
	/** 사찰 헤더 알림 점 용도 - 이 사찰 소속 프로그램들 중 입금확인 대기중(예약대기)인 예약이 있는지. */
	public long countPendingBankTransferByTemple(Long templeId) {
		List<Long> programIds = tspr.findByTemple_TempleId(templeId).stream()
				.map(TempleStayProgramEntity::getProgramId).toList();
		if (programIds.isEmpty()) {
			return 0;
		}
		return tsrr.countByProgramIdInAndStatus(programIds, TempleStayReservationEntity.Status.예약대기);
	}

	/** TempleInquiryService.submit()에서 예약 -> 프로그램 -> 사찰 ID를 찾을 때 씀
	    (클라이언트가 temple_id를 직접 골라 보내지 않고, 서버가 예약을 근거로 대상 사찰을 정한다). */
	public Long getTempleIdByProgramId(Long programId) {
		TempleStayProgramEntity program = tspr.findById(programId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 프로그램이 존재하지 않습니다."));
		return program.getTemple().getTempleId();
	}

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
				.lang(entity.getLang())
				.status(entity.getStatus())
				.canceledAt(entity.getCanceledAt())
				.createdAt(entity.getCreatedAt())
				.build();
	}
	
	/**
	 * 템플스테이 프로그램 예약 생성.
	 * 사찰 관리자가 "누구를 받을지" 임의로 고르는 승인 절차는 없다 - 정원/선착순 판단은
	 * 신청 시점에 이미 끝난다(자리 차지는 아래 정원 체크 시점에 확정되고, 결제수단과 무관하게
	 * 항상 같은 방식). 다만 결제수단이 계좌이체(무통장입금)면 실제 입금 여부를 시스템이 확인할
	 * 수 없어서, 예약 자체는 이 메서드가 바로 만들고 결제 단계(PaymentService.reserved)에서
	 * markPendingBankTransfer()로 예약대기로 내려간다 - "누가 받을지 고르는" 게 아니라
	 * "이미 확정된 자리의 입금 확인"만 나중에 하는 것이므로 위 원칙과 배치되지 않는다.
	 * 동시에 여러 명이 마지막 자리를 신청해도 한 명만 통과하도록 프로그램 행에 락을 걸고
	 * 정원을 확인한 뒤 같은 트랜잭션에서 예약을 저장한다.
	 * @param dto
	 * @return
	 */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public TempleStayReservationDTO reserved(TempleStayReservationDTO dto) {

		// login_id가 USER(회원) 테이블을 FK로 참조해서, 사찰/관리자 계정으로 예약을 시도하면
		// 저장 시점에 FK 위반으로 죽어 "신청 실패"만 뜨고 이유를 알 수 없었다 - 여기서 미리 막아서
		// 이유가 담긴 메시지로 내려준다(컨트롤러가 IllegalStateException을 409로 변환해서 alert로 보여줌).
		if (!userRepository.existsById(dto.getLoginId())) {
			throw new IllegalStateException("회원 계정으로만 예약할 수 있습니다. 사찰/관리자 계정은 예약할 수 없습니다.");
		}

		// 당일 예약 금지 - 최소 내일부터. reservation.js 캘린더에서 이미 당일을 선택 못 하게 막지만,
		// 그건 화면단 제약이라 API를 직접 호출하면 우회 가능하다 - 서버에서도 한 번 더 막는다.
		if (!dto.getStartDate().isAfter(LocalDate.now())) {
			throw new IllegalStateException("당일 예약은 불가능합니다. 내일 이후 날짜로 신청해 주세요.");
		}

		TempleStayProgramEntity program = tspr.findByIdForUpdate(dto.getProgramId())
				.orElseThrow(() -> new EntityNotFoundException("해당되는 프로그램이 존재하지 않습니다."));

		// 예약대기도 자리를 차지한 상태로 쳐야 하므로(그래야 3일 확인 기간 중 다른 사람이 같은
		// 자리에 또 신청해서 초과예약이 나는 걸 막음) '취소'만 빼고 카운트한다 - 그대로 둠.
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
				.lang(normalizeLang(dto.getLang()))
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
	
	/** 쿠키/요청에서 들어온 값이라 신뢰할 수 없음 - 지원 언어(ko/ja/en) 외에는 전부 ko로 */
	private static String normalizeLang(String lang) {
		return "ja".equals(lang) || "en".equals(lang) ? lang : "ko";
	}

	/** 마이페이지 허브 카드의 "예약 N건" 배지용 */
	public long countMyReservations(String loginId) {
		return tsrr.countByLoginId(loginId);
	}

	/** 회원의 템플스테이 예약 목록 */
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
	
	/**
	 * 회원 예약 취소
	 * 예약 취소 요청이 오면, 취소 가능한 상태인지 검증한 다음 상태(status)를 '취소'로 바꾼다.
	 */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public TempleStayReservationDTO canceledMyReservation(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId).orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		
		if (entity.getStatus() == TempleStayReservationEntity.Status.취소
				|| entity.getStatus() == TempleStayReservationEntity.Status.이용완료) {
			throw new IllegalStateException("이미 취소되었거나 이용이 완료된 예약입니다.");
		}
		
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
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public void cancelUnpaid(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		entity.setStatus(TempleStayReservationEntity.Status.취소);
	}

	/** 계좌이체 결제가 들어오면 예약을 예약대기로 내려서 사찰의 입금확인을 기다리게 한다.
	    PaymentService.reserved()(무통장입금 전용 - 카카오페이는 별도 흐름)에서만 호출됨. */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public void markPendingBankTransfer(Long reservationId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 템플스테이 예약 번호가 존재하지 않습니다."));
		entity.setStatus(TempleStayReservationEntity.Status.예약대기);
	}

	/** 사찰 관리자가 계좌이체 입금을 확인하고 예약대기 -> 예약확정으로 전환.
	    cancelByTempleAdmin과 동일하게 본인 사찰 프로그램인지 먼저 확인한다. */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public void confirmByTempleAdmin(Long reservationId, Long templeId) {
		TempleStayReservationEntity entity = tsrr.findById(reservationId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 예약이 존재하지 않습니다."));
		TempleStayProgramEntity program = tspr.findById(entity.getProgramId())
				.orElseThrow(() -> new EntityNotFoundException("해당되는 프로그램이 존재하지 않습니다."));

		if (!program.getTemple().getTempleId().equals(templeId)) {
			throw new IllegalStateException("본인 사찰의 예약만 확정할 수 있습니다.");
		}
		if (entity.getStatus() != TempleStayReservationEntity.Status.예약대기) {
			throw new IllegalStateException("입금확인 대상(예약대기)이 아닙니다.");
		}
		entity.setStatus(TempleStayReservationEntity.Status.예약확정);
	}

	/** 계좌이체 입금확인을 3일 안에 안 받은 예약대기 건을 자동 취소 - TempleStayReservationScheduler가 매일 호출.
	    PaymentService가 같은 건의 결제(대기중이던 걸로 취급)도 같이 취소 처리한다. */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
	public List<Long> findAndCancelStalePendingReservations(int graceDays) {
		LocalDateTime cutoff = LocalDateTime.now().minusDays(graceDays);
		List<TempleStayReservationEntity> stale = tsrr.findByStatusAndCreatedAtLessThanEqual(
				TempleStayReservationEntity.Status.예약대기, cutoff);

		List<Long> canceledIds = new ArrayList<>();
		for (TempleStayReservationEntity entity : stale) {
			entity.setStatus(TempleStayReservationEntity.Status.취소);
			canceledIds.add(entity.getReservationId());
		}
		return canceledIds;
	}

	/**
	 * 사찰 관리자가 자기 사찰 프로그램에 걸린 예약을 직접 취소.
	 * 이용자 취소(canceledMyReservation)와 달리 24시간 컷오프(체크인 전날까지만)는 적용하지
	 * 않는다 - 운영자가 판단해서 취소하는 것이라 이용자 보호용 규칙을 그대로 적용할 필요가
	 * 없음. 대신 이용 시작일이 이미 지난 예약은 "이미 다녀간(또는 다녀가는 중인) 예약"이라
	 * 취소 자체가 의미 없으므로 막는다(이런 건 아래 markPastReservationsCompleted가
	 * 이용완료로 자동 전환해준다). 이 예약이 진짜 본인 사찰 소속 프로그램인지도 반드시 확인한다
	 * (programId만 바꿔서 남의 사찰 예약을 취소하지 못하도록).
	 */
	@CacheEvict(value = {"programs", "programsByTemple", "program"}, allEntries = true)
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
		if (entity.getStartDate().isBefore(LocalDate.now())) {
			throw new IllegalStateException("이용 시작일이 지난 예약은 취소할 수 없습니다.");
		}
		entity.setStatus(TempleStayReservationEntity.Status.취소);
	}

	/** 이용 종료일이 지난 예약확정 건을 이용완료로 자동 전환 - TempleStayReservationScheduler가
	    매일 호출한다. 취소/예약대기/이미 이용완료인 건은 대상이 아니다(예약확정만 골라서 넘어감). */
	public int markPastReservationsCompleted() {
		List<TempleStayReservationEntity> ended = tsrr.findByStatusAndEndDateBefore(
				TempleStayReservationEntity.Status.예약확정, LocalDate.now());
		for (TempleStayReservationEntity entity : ended) {
			entity.setStatus(TempleStayReservationEntity.Status.이용완료);
		}
		return ended.size();
	}

	/** 사찰 프로그램 관리 > 상세보기 - 이 프로그램에 걸린 예약들을 대표자 인적사항과 함께 보여줌.
	    예전엔 예약마다 대표자를 따로 조회했는데(N+1), 관련 참가자 전체를 한 번에 가져온 뒤
	    예약별로 묶어서 맨 처음 등록된 사람(대표자)만 골라 쓰도록 바꿨다. */
	public List<ProgramReservationDTO> getByProgramId(Long programId) {
		List<TempleStayReservationEntity> reservations = tsrr.findByProgramIdOrderByStartDateAsc(programId);
		List<Long> reservationIds = reservations.stream().map(TempleStayReservationEntity::getReservationId).toList();

		// ORDER BY participantId asc로 가져왔으니, 예약별로 묶었을 때 그룹의 첫 원소가 대표자다
		// (Map은 삽입 순서를 보장 안 하므로 LinkedHashMap으로 순서를 지켜서 "첫 원소 = 최소 participantId"를 보장)
		Map<Long, ReservationParticipantEntity> representativeByReservationId = new LinkedHashMap<>();
		for (ReservationParticipantEntity p : rpr.findByReservationIdInOrderByParticipantIdAsc(reservationIds)) {
			representativeByReservationId.putIfAbsent(p.getReservationId(), p);
		}

		List<ProgramReservationDTO> result = new ArrayList<>();
		for (TempleStayReservationEntity r : reservations) {
			ReservationParticipantEntity representative = representativeByReservationId.get(r.getReservationId());
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

