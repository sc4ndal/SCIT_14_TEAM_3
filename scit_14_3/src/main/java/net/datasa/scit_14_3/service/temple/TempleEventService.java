package net.datasa.scit_14_3.service.temple;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleEventDTO;
import net.datasa.scit_14_3.domain.entity.temple.TempleEventEntity;
import net.datasa.scit_14_3.repository.temple.TempleEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/*
	사찰 행사(불교행사) 조회 - 홈 화면 "월간 불교 행사" 캘린더(home.js)가 /templeevents로 가져다 쓴다.
	즐겨찾기(관심 행사)는 "불교 행사" 목록 페이지(/events)와 마이페이지 관심 행사에서만 쓰인다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TempleEventService {

	private final TempleEventRepository templeEventRepository;
	private final FavoriteEventRepository favoriteEventRepository;

	public List<TempleEventDTO> getAll() {
		return templeEventRepository.findAllWithTemple().stream()
				.map(this::toDto)
		return templeEventRepository.findAll().stream()
				.map(event -> toDto(event, Collections.emptySet()))
				.toList();
	}

	/** "불교 행사" 목록 페이지(/events)용 - 가까운 일정부터 보이도록 시작일 오름차순 정렬. */
	public List<TempleEventDTO> getAllSortedByDate() {
		return templeEventRepository.findAllWithTempleOrderByStartDateAsc().stream()
				.map(this::toDto)
	public List<TempleEventDTO> getAllSortedByDate(String loginId) {
		Set<Long> favoritedIds = favoritedIds(loginId);
		return templeEventRepository.findAllByOrderByStartDateAsc().stream()
				.map(event -> toDto(event, favoritedIds))
				.toList();
	}

	/** 마이페이지 관심 행사 목록. */
	public List<TempleEventDTO> getFavorites(String loginId) {
		return favoriteEventRepository.findByLoginIdOrderByCreatedAtDesc(loginId).stream()
				.map(favorite -> toDto(favorite.getEvent(), Set.of(favorite.getEvent().getEventId())))
				.toList();
	}

	/** 이미 즐겨찾기한 상태면 해제, 아니면 새로 등록. 반환값은 처리 후 즐겨찾기 상태(true=등록됨). */
	@Transactional
	public boolean toggleFavorite(String loginId, Long eventId) {
		var existing = favoriteEventRepository.findByLoginIdAndEvent_EventId(loginId, eventId);
		if (existing.isPresent()) {
			favoriteEventRepository.delete(existing.get());
			log.debug("행사 즐겨찾기 해제: loginId={}, eventId={}", loginId, eventId);
			return false;
		}

		TempleEventEntity event = templeEventRepository.findById(eventId)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 행사입니다."));
		favoriteEventRepository.save(FavoriteEventEntity.builder()
				.loginId(loginId)
				.event(event)
				.build());
		log.debug("행사 즐겨찾기 등록: loginId={}, eventId={}", loginId, eventId);
		return true;
	}

	private Set<Long> favoritedIds(String loginId) {
		return loginId == null ? Collections.emptySet() : favoriteEventRepository.findFavoritedEventIds(loginId);
	}

	private TempleEventDTO toDto(TempleEventEntity entity, Set<Long> favoritedIds) {
		return TempleEventDTO.builder()
				.eventId(entity.getEventId())
				.templeId(entity.getTemple().getTempleId())
				.templeName(entity.getTemple().getName())
				.title(entity.getTitle())
				.description(entity.getDescription())
				.startDate(entity.getStartDate())
				.endDate(entity.getEndDate())
				.linkUrl(entity.getLinkUrl())
				.favorited(favoritedIds.contains(entity.getEventId()))
				.build();
	}
}
