package net.datasa.scit_14_3.service.temple;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.temple.TempleEventDTO;
import net.datasa.scit_14_3.domain.entity.temple.FavoriteEventEntity;
import net.datasa.scit_14_3.domain.entity.temple.TempleEventEntity;
import net.datasa.scit_14_3.repository.temple.FavoriteEventRepository;
import net.datasa.scit_14_3.repository.temple.TempleEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

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
				.map(event -> toDto(event, Collections.emptySet()))
				.toList();
	}

	/**
	 * "불교 행사" 목록 페이지(/events)용 - [진행 중(현재) → 예정(미래) → 종료(과거)] 순.
	 * 같은 그룹 안에서는 항상 시작일 기준으로 정렬한다(종료일 아님) - 예를 들어 5/1~5/5인 행사와
	 * 5/5 하루짜리 행사가 있으면, 종료일은 둘 다 5/5로 같아도 5/1에 시작하는 행사가 먼저 나와야
	 * 하기 때문이다. 과거 그룹만 예외로, 최근에 끝난 것부터 보이도록 종료일 내림차순으로 묶는다.
	 */
	public List<TempleEventDTO> getAllSortedByDate(String loginId) {
		Set<Long> favoritedIds = favoritedIds(loginId);
		LocalDate today = LocalDate.now();
		List<TempleEventEntity> entities = templeEventRepository.findAllWithTemple();

		List<TempleEventEntity> current = entities.stream()
				.filter(e -> !e.getStartDate().isAfter(today) && !e.getEndDate().isBefore(today))
				.sorted(Comparator.comparing(TempleEventEntity::getStartDate))
				.toList();
		List<TempleEventEntity> future = entities.stream()
				.filter(e -> e.getStartDate().isAfter(today))
				.sorted(Comparator.comparing(TempleEventEntity::getStartDate))
				.toList();
		List<TempleEventEntity> past = entities.stream()
				.filter(e -> e.getEndDate().isBefore(today))
				.sorted(Comparator.comparing(TempleEventEntity::getEndDate).reversed())
				.toList();

		return Stream.of(current, future, past)
				.flatMap(List::stream)
				.map(event -> toDto(event, favoritedIds))
				.toList();
	}

	/** 마이페이지 허브 카드의 "관심 행사 N건" 배지용 */
	public long countFavorites(String loginId) {
		return favoriteEventRepository.countByLoginId(loginId);
	}

	/** 마이페이지 관심 행사 목록 - 아직 안 끝난 행사(오늘 포함)를 가까운 날짜순으로 먼저 보여주고,
	    이미 끝난 행사는 그 뒤에 최근에 끝난 것부터 오래된 순으로 이어붙인다. */
	public List<TempleEventDTO> getFavorites(String loginId) {
		LocalDate today = LocalDate.now();
		Comparator<TempleEventDTO> upcomingFirstThenRecentPast = (a, b) -> {
			boolean aPast = a.getEndDate().isBefore(today);
			boolean bPast = b.getEndDate().isBefore(today);
			if (aPast != bPast) {
				return aPast ? 1 : -1; // 안 끝난 쪽(false)이 앞으로
			}
			return aPast
					? b.getStartDate().compareTo(a.getStartDate()) // 지난 행사: 최근에 끝난 것부터
					: a.getStartDate().compareTo(b.getStartDate()); // 예정 행사: 가까운 날짜부터
		};

		return favoriteEventRepository.findByLoginIdOrderByCreatedAtDesc(loginId).stream()
				.map(favorite -> toDto(favorite.getEvent(), Set.of(favorite.getEvent().getEventId())))
				.sorted(upcomingFirstThenRecentPast)
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
				.past(entity.getEndDate().isBefore(LocalDate.now()))
				.build();
	}
}
