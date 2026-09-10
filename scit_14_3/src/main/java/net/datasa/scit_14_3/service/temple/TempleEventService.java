package net.datasa.scit_14_3.service.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleEventDTO;
import net.datasa.scit_14_3.domain.entity.temple.TempleEventEntity;
import net.datasa.scit_14_3.repository.temple.TempleEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/*
	사찰 행사(불교행사) 조회 - 홈 화면 "월간 불교 행사" 캘린더(home.js)가 /templeevents로 가져다 쓴다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TempleEventService {

	private final TempleEventRepository templeEventRepository;

	public List<TempleEventDTO> getAll() {
		return templeEventRepository.findAll().stream()
				.map(this::toDto)
				.toList();
	}

	/** "불교 행사" 목록 페이지(/events)용 - 가까운 일정부터 보이도록 시작일 오름차순 정렬. */
	public List<TempleEventDTO> getAllSortedByDate() {
		return templeEventRepository.findAllByOrderByStartDateAsc().stream()
				.map(this::toDto)
				.toList();
	}

	private TempleEventDTO toDto(TempleEventEntity entity) {
		return TempleEventDTO.builder()
				.eventId(entity.getEventId())
				.templeId(entity.getTemple().getTempleId())
				.templeName(entity.getTemple().getName())
				.title(entity.getTitle())
				.description(entity.getDescription())
				.startDate(entity.getStartDate())
				.endDate(entity.getEndDate())
				.linkUrl(entity.getLinkUrl())
				.build();
	}
}
