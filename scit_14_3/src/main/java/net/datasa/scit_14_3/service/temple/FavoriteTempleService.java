package net.datasa.scit_14_3.service.temple;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.entity.temple.FavoriteTempleEntity;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.repository.temple.FavoriteTempleRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/** 사찰 즐겨찾기 - 지도 정보창의 별표, 사찰 상세보기의 즐겨찾기 버튼, 마이페이지 > 관심 사찰 목록에서 씀. */
@Service
@RequiredArgsConstructor
public class FavoriteTempleService {

	private final FavoriteTempleRepository ftr;
	private final TempleRepository templeRepository;

	/** 비로그인이면 아무것도 즐겨찾기한 게 없는 것과 동일하게 처리 - 목록 화면에서 즐겨찾기 표시용. */
	public Set<Long> favoritedIds(String loginId) {
		return loginId == null ? Collections.emptySet() : ftr.findFavoritedTempleIds(loginId);
	}

	public boolean isFavorited(String loginId, Long templeId) {
		return loginId != null && ftr.existsByLoginIdAndTemple_TempleId(loginId, templeId);
	}

	public List<TempleDTO> getFavorites(String loginId) {
		return ftr.findByLoginId(loginId).stream()
				.map(f -> toDto(f.getTemple()))
				.toList();
	}

	/** 이미 즐겨찾기한 상태면 해제, 아니면 새로 등록. 반환값은 처리 후 즐겨찾기 상태(true=등록됨). */
	@Transactional
	public boolean toggleFavorite(String loginId, Long templeId) {
		if (ftr.existsByLoginIdAndTemple_TempleId(loginId, templeId)) {
			ftr.deleteByLoginIdAndTemple_TempleId(loginId, templeId);
			return false;
		}

		TempleEntity temple = templeRepository.findById(templeId)
				.orElseThrow(() -> new EntityNotFoundException("존재하지 않는 사찰입니다."));
		ftr.save(FavoriteTempleEntity.builder()
				.loginId(loginId)
				.temple(temple)
				.build());
		return true;
	}

	private TempleDTO toDto(TempleEntity entity) {
		return TempleDTO.builder()
				.templeId(entity.getTempleId())
				.name(entity.getName())
				.imageUrl(entity.getImageUrl())
				.latitude(entity.getLatitude())
				.longitude(entity.getLongitude())
				.address(entity.getAddress())
				.region(entity.getRegion())
				.supportSea(entity.isSupportSea())
				.supportMountain(entity.isSupportMountain())
				.supportRiver(entity.isSupportRiver())
				.supportUrban(entity.isSupportUrban())
				.supportEnglish(entity.isSupportEnglish())
				.isTemple(entity.isTemple())
				.specialNotice(entity.getSpecialNotice())
				.refundPolicy(entity.getRefundPolicy())
				.favorited(true)
				.build();
	}
}
