package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayProgramRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayProgramService {
	private final TempleStayProgramRepository tspr;
	private final TempleRepository templeRepository;

	private TempleStayProgramDTO toDto(TempleStayProgramEntity entity) {
		return TempleStayProgramDTO.builder()
				.programId(entity.getProgramId())
				.templeId(entity.getTemple().getTempleId()) // entity.getTemple()로 한 번 거쳐서 ID 꺼냄
				.templeName(entity.getTemple().getName())       // 조인된 사찰에서 바로 꺼냄
				.templeAddress(entity.getTemple().getAddress()) // 조인된 사찰에서 바로 꺼냄
				.title(entity.getTitle())
				.programType(entity.getProgramType())
				.imageUrl(entity.getImageUrl())
				.description(entity.getDescription())
				.schedule(entity.getSchedule())
				.requiredItems(entity.getRequiredItems())
				.templeRefundPolicy(entity.getTemple().getRefundPolicy())
				.templePrecautions(entity.getTemple().getSpecialNotice())
				.price(entity.getPrice())
				.duration(entity.getDuration())
				.openStartDate(entity.getOpenStartDate())
				.openEndDate(entity.getOpenEndDate())
				.maxParticipant(entity.getMaxParticipant())
				.supportEnglish(entity.isSupportEnglish())
				.latitude(entity.getTemple().getLatitude())
				.longitude(entity.getTemple().getLongitude())
				.createdAt(entity.getCreatedAt())
				.build();
	}

	/**
	 * 데이터 불러오기
	 * @param programId
	 * @return
	 */
	public TempleStayProgramDTO getInfo(Long programId) {
		TempleStayProgramEntity entity = tspr.findById(programId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		return toDto(entity);
	}

	/**
	 * 전제조회
	 * @return
	 */
	public List<TempleStayProgramDTO> getAll() {
		return tspr.findAll().stream().map(this::toDto).toList();
	}

	/** 사찰 계정 자신이 등록한 프로그램만 (마이페이지 > 사찰 프로그램 관리) */
	public List<TempleStayProgramDTO> getByTemple(Long templeId) {
		return tspr.findByTemple_TempleId(templeId).stream().map(this::toDto).toList();
	}

	/** 수정 폼 진입용 - 본인 사찰 소속 프로그램인지 같이 확인 */
	public TempleStayProgramDTO getForOwner(Long programId, Long templeId) {
		TempleStayProgramEntity entity = tspr.findByProgramIdAndTemple_TempleId(programId, templeId)
				.orElseThrow(() -> new EntityNotFoundException("해당 프로그램을 찾을 수 없습니다."));
		return toDto(entity);
	}

	private void validate(TempleStayProgramDTO dto) {
		if (dto.getImageUrl() == null || dto.getImageUrl().isBlank()) {
			throw new IllegalStateException("대표 이미지를 등록해주세요.");
		}
		if (dto.getOpenStartDate() == null || dto.getOpenEndDate() == null) {
			throw new IllegalStateException("모집 시작일/종료일을 입력해주세요.");
		}
		if (dto.getOpenEndDate().isBefore(dto.getOpenStartDate())) {
			throw new IllegalStateException("모집 종료일은 시작일보다 빠를 수 없습니다.");
		}
	}

	// duration(진행 기간)은 사업 규칙상 programType에 종속돼있어서(당일형=당일, 체험형/휴식형=1박 2일)
	// 입력받지 않고 여기서 고정으로 정함.
	private String computeDuration(TempleStayProgramEntity.ProgramType programType) {
		return programType == TempleStayProgramEntity.ProgramType.당일형 ? "당일" : "1박 2일";
	}

	/**
	 * 사찰 계정이 자기 사찰 소속으로 프로그램을 새로 등록.
	 * support_english/latitude/longitude는 DB 트리거가 소속 TEMPLE 값으로 저장 시점에
	 * 덮어쓰므로(docs/buddhist-site-schema.sql 참고) 여기서 안 채워도 됨.
	 */
	public void register(TempleStayProgramDTO dto, Long templeId) {
		TempleEntity temple = templeRepository.findById(templeId)
				.orElseThrow(() -> new EntityNotFoundException("사찰 계정을 찾을 수 없습니다."));

		validate(dto);

		TempleStayProgramEntity entity = TempleStayProgramEntity.builder()
				.temple(temple)
				.title(dto.getTitle())
				.programType(dto.getProgramType())
				.imageUrl(dto.getImageUrl())
				.description(dto.getDescription())
				.schedule(dto.getSchedule())
				.requiredItems(dto.getRequiredItems())
				.price(dto.getPrice())
				.duration(computeDuration(dto.getProgramType()))
				.openStartDate(dto.getOpenStartDate())
				.openEndDate(dto.getOpenEndDate())
				.build();
		tspr.save(entity);
	}

	/** 본인 사찰 소속 프로그램만 수정 가능 - programId만 바꿔서 남의 프로그램을 건드릴 수 없도록
	    findByProgramIdAndTemple_TempleId로 소유 사찰까지 같이 확인. */
	public void update(Long programId, TempleStayProgramDTO dto, Long templeId) {
		TempleStayProgramEntity entity = tspr.findByProgramIdAndTemple_TempleId(programId, templeId)
				.orElseThrow(() -> new EntityNotFoundException("해당 프로그램을 찾을 수 없습니다."));

		validate(dto);

		entity.setTitle(dto.getTitle());
		entity.setProgramType(dto.getProgramType());
		entity.setImageUrl(dto.getImageUrl());
		entity.setDescription(dto.getDescription());
		entity.setSchedule(dto.getSchedule());
		entity.setRequiredItems(dto.getRequiredItems());
		entity.setPrice(dto.getPrice());
		entity.setDuration(computeDuration(dto.getProgramType()));
		entity.setOpenStartDate(dto.getOpenStartDate());
		entity.setOpenEndDate(dto.getOpenEndDate());
	}

	/** 본인 사찰 소속 프로그램만 삭제 가능. 이미 예약이 걸린 프로그램은 외래키 제약으로 삭제가
	    막히므로(TEMPLE_STAY_RESERVATION.program_id) 친절한 에러로 안내함. */
	public void delete(Long programId, Long templeId) {
		TempleStayProgramEntity entity = tspr.findByProgramIdAndTemple_TempleId(programId, templeId)
				.orElseThrow(() -> new EntityNotFoundException("해당 프로그램을 찾을 수 없습니다."));
		try {
			tspr.delete(entity);
			tspr.flush();
		} catch (DataIntegrityViolationException e) {
			throw new IllegalStateException("이 프로그램에 연결된 예약이 있어 삭제할 수 없습니다.");
		}
	}
}
