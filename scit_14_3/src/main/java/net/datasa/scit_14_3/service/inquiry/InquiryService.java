package net.datasa.scit_14_3.service.inquiry;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.inquiry.InquiryDto;
import net.datasa.scit_14_3.domain.entity.inquiry.InquiryEntity;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.repository.inquiry.InquiryRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InquiryService {

	private final InquiryRepository inquiryRepository;
	private final UserRepository userRepository;

	public InquiryDto submit(String loginId, String title, String content) {
		InquiryEntity entity = InquiryEntity.builder()
				.loginId(loginId)
				.title(title)
				.content(content)
				.build();
		return toDto(inquiryRepository.save(entity), null);
	}

	/** 마이페이지 - 내 문의 목록 (최신순) */
	public List<InquiryDto> getMine(String loginId) {
		List<InquiryDto> result = new ArrayList<>();
		for (InquiryEntity entity : inquiryRepository.findByLoginIdOrderByCreatedAtDesc(loginId)) {
			result.add(toDto(entity, null));
		}
		return result;
	}

	/** 관리자 목록 - 대기중인 문의가 먼저 보이도록 정렬, 작성자 법명도 같이 채워줌 */
	public List<InquiryDto> getAll() {
		List<InquiryDto> result = new ArrayList<>();
		for (InquiryEntity entity : inquiryRepository.findAllByOrderByStatusAscCreatedAtDesc()) {
			result.add(toDto(entity, resolveNickname(entity.getLoginId())));
		}
		return result;
	}

	public long getPendingCount() {
		return inquiryRepository.countByStatus(InquiryEntity.Status.대기);
	}

	/** 본인 확인 없이(관리자용) 조회 - 작성자 법명도 채워서 반환 */
	public InquiryDto getInfo(Long inquiryId) {
		InquiryEntity entity = findEntity(inquiryId);
		return toDto(entity, resolveNickname(entity.getLoginId()));
	}

	/** 마이페이지 상세 - 본인 글이 맞는지 확인해서 다른 사람 문의를 못 보게 함 */
	public InquiryDto getInfo(Long inquiryId, String loginId) {
		InquiryEntity entity = findEntity(inquiryId);
		if (!entity.getLoginId().equals(loginId)) {
			throw new IllegalStateException("본인이 작성한 문의만 확인할 수 있습니다.");
		}
		return toDto(entity, null);
	}

	public void answer(Long inquiryId, String answer) {
		InquiryEntity entity = findEntity(inquiryId);
		entity.setAnswer(answer);
		entity.setStatus(InquiryEntity.Status.답변완료);
		entity.setAnsweredAt(LocalDateTime.now());
		inquiryRepository.save(entity);
	}

	private InquiryEntity findEntity(Long inquiryId) {
		return inquiryRepository.findById(inquiryId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 문의가 존재하지 않습니다."));
	}

	private String resolveNickname(String loginId) {
		return userRepository.findById(loginId).map(UserEntity::getNickname).orElse(loginId);
	}

	private InquiryDto toDto(InquiryEntity entity, String nickname) {
		return InquiryDto.builder()
				.inquiryId(entity.getInquiryId())
				.loginId(entity.getLoginId())
				.nickname(nickname)
				.title(entity.getTitle())
				.content(entity.getContent())
				.answer(entity.getAnswer())
				.status(entity.getStatus())
				.createdAt(entity.getCreatedAt())
				.answeredAt(entity.getAnsweredAt())
				.build();
	}
}
