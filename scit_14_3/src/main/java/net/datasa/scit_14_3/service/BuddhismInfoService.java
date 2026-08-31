package net.datasa.scit_14_3.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.TermCategory;
import net.datasa.scit_14_3.domain.dto.TermCardDTO;
import net.datasa.scit_14_3.domain.dto.TermGroupDTO;
import net.datasa.scit_14_3.domain.entity.BuddhismInfoEntity;
import net.datasa.scit_14_3.repository.BuddhismInfoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/*
	불교 정보 게시글 조회 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class BuddhismInfoService {

	/** 용어 사전에 뿌릴 게시글의 대분류 값 */
	public static final String CATEGORY_TERM = "용어";

	/*
		경전 카테고리에만 붙는 난이도 배지.
		BUDDHISM_INFO에 난이도 컬럼이 없어서 제목 기준 정적 매핑으로 처리한다.
	 */
	private static final Map<String, String> SCRIPTURE_DIFFICULTY = Map.of(
			"반야심경", "⭐",
			"법화경", "⭐⭐",
			"화엄경", "⭐⭐⭐"
	);

	private final BuddhismInfoRepository buddhismInfoRepository;

	/**
	 * category='용어' 게시글을 읽어 8개 소분류로 그룹핑한다.
	 * 소분류 순서는 TermCategory 선언 순서, 그룹 안 순서는 TermCategory에 나열한 제목 순서를 따른다.
	 * 용어가 하나도 없는 소분류는 화면에 탭을 만들지 않도록 결과에서 뺀다.
	 */
	public List<TermGroupDTO> loadTermGroups() {
		List<BuddhismInfoEntity> terms = buddhismInfoRepository.findByCategoryOrderByPostIdAsc(CATEGORY_TERM);

		Map<TermCategory, List<BuddhismInfoEntity>> grouped = new EnumMap<>(TermCategory.class);
		for (BuddhismInfoEntity term : terms) {
			grouped.computeIfAbsent(TermCategory.of(term.getTitle()), key -> new ArrayList<>()).add(term);
		}

		List<TermGroupDTO> groups = new ArrayList<>();
		for (TermCategory category : TermCategory.values()) {
			List<BuddhismInfoEntity> items = grouped.get(category);
			if (items == null || items.isEmpty()) {
				continue;
			}
			items.sort(Comparator.comparingInt(item -> category.orderOf(item.getTitle())));
			groups.add(new TermGroupDTO(category, items.stream().map(item -> toCard(category, item)).toList()));
		}

		log.debug("용어 사전 로드: 용어 {}개, 소분류 {}개", terms.size(), groups.size());
		return groups;
	}

	/**
	 * 대분류별 게시글 목록. category가 비어 있으면 전체를 반환한다.
	 */
	public List<BuddhismInfoEntity> loadPosts(String category) {
		if (category == null || category.isBlank()) {
			return buddhismInfoRepository.findAllByOrderByPostIdAsc();
		}
		return buddhismInfoRepository.findByCategoryOrderByPostIdAsc(category);
	}

	private TermCardDTO toCard(TermCategory category, BuddhismInfoEntity entity) {
		String difficulty = category == TermCategory.SCRIPTURE
				? SCRIPTURE_DIFFICULTY.get(entity.getTitle())
				: null;
		return new TermCardDTO(entity.getPostId(), entity.getTitle(), entity.getContent(), difficulty);
	}
}
