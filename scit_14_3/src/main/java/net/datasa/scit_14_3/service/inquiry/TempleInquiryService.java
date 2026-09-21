package net.datasa.scit_14_3.service.inquiry;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.inquiry.TempleInquiryDto;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.inquiry.TempleInquiryEntity;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.repository.inquiry.TempleInquiryRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 회원이 사찰에게 남기는 1:1 문의 - INQUIRY(회원->사이트관리자)와 별개.
    24시간 이내라 예약을 직접 취소 못 할 때 사찰에 취소를 요청하는 용도로 만듦. */
@Service
@RequiredArgsConstructor
@Transactional
public class TempleInquiryService {

	private final TempleInquiryRepository templeInquiryRepository;
	private final UserRepository userRepository;
	private final TempleRepository templeRepository;
	private final TempleStayReservationService reservationService;

	/** 문의 등록 - reservationId로부터 대상 사찰을 서버가 직접 찾아서 채운다(클라이언트가
	    temple_id를 직접 골라서 보내는 방식이 아니라, "이 예약에 대해 문의한다"만 넘기면 됨 -
	    엉뚱한 사찰에 문의가 가는 걸 막을 수 있고 화면(사찰 선택 UI)도 필요 없어진다). */
	public TempleInquiryDto submit(String loginId, Long reservationId, String title, String content) {
		TempleStayReservationDTO reservation = reservationService.getInfo(reservationId);
		if (!reservation.getLoginId().equals(loginId)) {
			throw new IllegalStateException("본인 예약에 대해서만 문의할 수 있습니다.");
		}
		Long templeId = reservationService.getTempleIdByProgramId(reservation.getProgramId());

		TempleInquiryEntity entity = TempleInquiryEntity.builder()
				.loginId(loginId)
				.templeId(templeId)
				.reservationId(reservationId)
				.title(title)
				.content(content)
				.build();
		return toDto(templeInquiryRepository.save(entity), null, null);
	}

	/** 마이페이지 - 내가 사찰에 남긴 문의 목록(최신순), 사찰명도 같이 채워줌. */
	public List<TempleInquiryDto> getMine(String loginId) {
		List<TempleInquiryEntity> entities = templeInquiryRepository.findByLoginIdOrderByCreatedAtDesc(loginId);

		List<Long> templeIds = entities.stream().map(TempleInquiryEntity::getTempleId).distinct().toList();
		Map<Long, String> templeNameMap = templeRepository.findAllById(templeIds).stream()
				.collect(Collectors.toMap(TempleEntity::getTempleId, TempleEntity::getName));

		List<TempleInquiryDto> result = new ArrayList<>();
		for (TempleInquiryEntity entity : entities) {
			result.add(toDto(entity, null, templeNameMap.get(entity.getTempleId())));
		}
		return result;
	}

	/** 사찰 관리자 목록 - 대기중인 문의가 먼저 보이도록 정렬, 작성자 법명도 같이 채워줌(N+1 방지). */
	public List<TempleInquiryDto> getByTemple(Long templeId) {
		List<TempleInquiryEntity> entities = templeInquiryRepository.findByTempleIdOrderByStatusAscCreatedAtDesc(templeId);

		List<String> loginIds = entities.stream().map(TempleInquiryEntity::getLoginId).distinct().toList();
		Map<String, String> nicknameMap = userRepository.findAllById(loginIds).stream()
				.collect(Collectors.toMap(UserEntity::getLoginId, UserEntity::getNickname));

		List<TempleInquiryDto> result = new ArrayList<>();
		for (TempleInquiryEntity entity : entities) {
			result.add(toDto(entity, nicknameMap.getOrDefault(entity.getLoginId(), entity.getLoginId()), null));
		}
		return result;
	}

	/** 헤더 알림 점 용도 - 이 사찰에 대기중인 문의가 있는지. */
	public long getPendingCount(Long templeId) {
		return templeInquiryRepository.countByTempleIdAndStatus(templeId, TempleInquiryEntity.Status.대기);
	}

	/** 마이페이지 상세 - 본인 글이 맞는지 확인해서 다른 사람 문의를 못 보게 함. */
	public TempleInquiryDto getInfo(Long inquiryId, String loginId) {
		TempleInquiryEntity entity = findEntity(inquiryId);
		if (!entity.getLoginId().equals(loginId)) {
			throw new IllegalStateException("본인이 작성한 문의만 확인할 수 있습니다.");
		}
		String templeName = templeRepository.findById(entity.getTempleId()).map(TempleEntity::getName).orElse(null);
		return toDto(entity, null, templeName);
	}

	/** 사찰 관리자 상세 - 본인 사찰로 온 문의가 맞는지 확인(inquiryId만 바꿔서 남의 사찰 문의를 못 보게). */
	public TempleInquiryDto getInfoForTemple(Long inquiryId, Long templeId) {
		TempleInquiryEntity entity = findEntity(inquiryId);
		if (!entity.getTempleId().equals(templeId)) {
			throw new IllegalStateException("본인 사찰로 온 문의만 확인할 수 있습니다.");
		}
		return toDto(entity, resolveNickname(entity.getLoginId()), null);
	}

	public void answer(Long inquiryId, Long templeId, String answer) {
		TempleInquiryEntity entity = findEntity(inquiryId);
		if (!entity.getTempleId().equals(templeId)) {
			throw new IllegalStateException("본인 사찰로 온 문의만 답변할 수 있습니다.");
		}
		entity.setAnswer(answer);
		entity.setStatus(TempleInquiryEntity.Status.답변완료);
		entity.setAnsweredAt(LocalDateTime.now());
	}

	private TempleInquiryEntity findEntity(Long inquiryId) {
		return templeInquiryRepository.findById(inquiryId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 문의가 존재하지 않습니다."));
	}

	private String resolveNickname(String loginId) {
		return userRepository.findById(loginId).map(UserEntity::getNickname).orElse(loginId);
	}

	private TempleInquiryDto toDto(TempleInquiryEntity entity, String nickname, String templeName) {
		return TempleInquiryDto.builder()
				.inquiryId(entity.getInquiryId())
				.loginId(entity.getLoginId())
				.nickname(nickname)
				.templeId(entity.getTempleId())
				.templeName(templeName)
				.reservationId(entity.getReservationId())
				.title(entity.getTitle())
				.content(entity.getContent())
				.answer(entity.getAnswer())
				.status(entity.getStatus())
				.createdAt(entity.getCreatedAt())
				.answeredAt(entity.getAnsweredAt())
				.build();
	}
}
