package net.datasa.scit_14_3.service.buddhism;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.buddhism.DailyQuoteDTO;
import net.datasa.scit_14_3.domain.entity.buddhism.DailyQuoteEntity;
import net.datasa.scit_14_3.domain.entity.buddhism.FavoriteQuoteEntity;
import net.datasa.scit_14_3.repository.buddhism.DailyQuoteRepository;
import net.datasa.scit_14_3.repository.buddhism.FavoriteQuoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/*
	알아보기 > 오늘의 불교 한마디 (/info/quote)

	DAILY_QUOTE에는 날짜 컬럼이 없어서(문서 참고), "오늘의 한마디"는 매일 자정마다
	자연스럽게 바뀌도록 오늘 날짜(epoch day)를 시드로 전체 목록에서 하나를 결정적으로
	골라 보여준다 - 같은 날에는 새로고침해도 항상 같은 한마디가 나온다.
	완전 무작위 한마디는 "다른 한마디 보기" 버튼(findRandomQuote)에서만 쓴다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DailyQuoteService {

	private final DailyQuoteRepository dailyQuoteRepository;
	private final FavoriteQuoteRepository favoriteQuoteRepository;

	public DailyQuoteDTO getQuoteOfTheDay(String loginId) {
		List<DailyQuoteEntity> quotes = dailyQuoteRepository.findAllByOrderByQuoteIdAsc();
		if (quotes.isEmpty()) {
			return null;
		}
		int index = (int) (LocalDate.now().toEpochDay() % quotes.size());
		return toDto(quotes.get(index), favoritedIds(loginId));
	}

	/** "다른 한마디 보기"를 누를 때마다 서버까지 왕복하지 않도록, 페이지 로드 시 전체 한마디(30건
	    내외라 부담 없음)를 한 번에 내려준다 - 클라이언트가 이 안에서 랜덤으로 골라 화면만 바꾼다. */
	public List<DailyQuoteDTO> getAllQuotes(String loginId) {
		Set<Long> favorited = favoritedIds(loginId);
		return dailyQuoteRepository.findAllByOrderByQuoteIdAsc().stream()
				.map(quote -> toDto(quote, favorited))
				.toList();
	}

	public List<DailyQuoteDTO> getFavorites(String loginId) {
		return favoriteQuoteRepository.findByLoginIdOrderByCreatedAtDesc(loginId).stream()
				.map(favorite -> toDto(favorite.getQuote(), Set.of(favorite.getQuote().getQuoteId())))
				.toList();
	}

	/** 이미 즐겨찾기한 상태면 해제, 아니면 새로 등록. 반환값은 처리 후 즐겨찾기 상태(true=등록됨). */
	@Transactional
	public boolean toggleFavorite(String loginId, Long quoteId) {
		var existing = favoriteQuoteRepository.findByLoginIdAndQuote_QuoteId(loginId, quoteId);
		if (existing.isPresent()) {
			favoriteQuoteRepository.delete(existing.get());
			log.debug("한마디 즐겨찾기 해제: loginId={}, quoteId={}", loginId, quoteId);
			return false;
		}

		// quoteId는 항상 서버가 이미 렌더링해둔 목록에서 온 값이라 존재를 다시 확인할 필요가 없음 -
		// findById 대신 getReferenceById(프록시, 쿼리 안 나감)로 원격 DB 왕복 한 번을 줄인다.
		// (없는 id를 억지로 넘기면 이 시점이 아니라 insert 시 FK 위반으로 늦게 걸림 - 정상 흐름에서는
		// 발생하지 않는 경우라 감수함)
		DailyQuoteEntity quote = dailyQuoteRepository.getReferenceById(quoteId);
		favoriteQuoteRepository.save(FavoriteQuoteEntity.builder()
				.loginId(loginId)
				.quote(quote)
				.build());
		log.debug("한마디 즐겨찾기 등록: loginId={}, quoteId={}", loginId, quoteId);
		return true;
	}

	private Set<Long> favoritedIds(String loginId) {
		return loginId == null ? Collections.emptySet() : favoriteQuoteRepository.findFavoritedQuoteIds(loginId);
	}

	private DailyQuoteDTO toDto(DailyQuoteEntity entity, Set<Long> favoritedIds) {
		return new DailyQuoteDTO(entity.getQuoteId(), entity.getContent(), entity.getSource(),
				favoritedIds.contains(entity.getQuoteId()));
	}
}
