package net.datasa.scit_14_3.service.buddhism;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.buddhism.TempleFoodDTO;
import net.datasa.scit_14_3.domain.entity.buddhism.FavoriteFoodEntity;
import net.datasa.scit_14_3.domain.entity.buddhism.TempleFoodEntity;
import net.datasa.scit_14_3.repository.buddhism.FavoriteFoodRepository;
import net.datasa.scit_14_3.repository.buddhism.TempleFoodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/*
	알아보기 > 사찰 음식 (/info/food)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TempleFoodService {

	private final TempleFoodRepository templeFoodRepository;
	private final FavoriteFoodRepository favoriteFoodRepository;

	public List<TempleFoodDTO> getAllFoods(String loginId) {
		Set<Long> favoritedIds = favoritedIds(loginId);
		return templeFoodRepository.findAllByOrderByRecommendationIdAsc().stream()
				.map(food -> toDto(food, favoritedIds))
				.toList();
	}

	public List<TempleFoodDTO> getFavorites(String loginId) {
		return favoriteFoodRepository.findByLoginIdOrderByCreatedAtDesc(loginId).stream()
				.map(favorite -> toDto(favorite.getFood(), Set.of(favorite.getFood().getRecommendationId())))
				.toList();
	}

	/** 이미 즐겨찾기한 상태면 해제, 아니면 새로 등록. 반환값은 처리 후 즐겨찾기 상태(true=등록됨). */
	@Transactional
	public boolean toggleFavorite(String loginId, Long recommendationId) {
		var existing = favoriteFoodRepository.findByLoginIdAndFood_RecommendationId(loginId, recommendationId);
		if (existing.isPresent()) {
			favoriteFoodRepository.delete(existing.get());
			log.debug("사찰음식 즐겨찾기 해제: loginId={}, recommendationId={}", loginId, recommendationId);
			return false;
		}

		TempleFoodEntity food = templeFoodRepository.findById(recommendationId)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사찰음식입니다."));
		favoriteFoodRepository.save(FavoriteFoodEntity.builder()
				.loginId(loginId)
				.food(food)
				.build());
		log.debug("사찰음식 즐겨찾기 등록: loginId={}, recommendationId={}", loginId, recommendationId);
		return true;
	}

	private Set<Long> favoritedIds(String loginId) {
		return loginId == null ? Collections.emptySet() : favoriteFoodRepository.findFavoritedFoodIds(loginId);
	}

	private TempleFoodDTO toDto(TempleFoodEntity entity, Set<Long> favoritedIds) {
		return new TempleFoodDTO(entity.getRecommendationId(), entity.getFoodName(), entity.getDescription(),
				entity.getRecipe(), entity.getRecipeUrl(), entity.getImageUrl(),
				favoritedIds.contains(entity.getRecommendationId()));
	}
}
