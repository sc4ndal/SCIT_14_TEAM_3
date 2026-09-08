package net.datasa.scit_14_3.service.temple;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.entity.temple.FavoriteTempleEntity;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.repository.temple.FavoriteTempleRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FavoriteTempleService {
	private final FavoriteTempleRepository ftr;
	private final TempleService ts;
	private final TempleRepository tr;
	
	public boolean toggleFavoriteTemple(String loginId, Long templeId) {
		boolean alreadyFavoriteTemple = ftr.existsByLoginIdAndTemple_TempleId(loginId, templeId);
		
		// 즐겨찾기가 되어 있으면 취소로 변경, 즐겨찾기가 되어 있지 않으면 등록
		if(alreadyFavoriteTemple) {
			ftr.deleteByLoginIdAndTemple_TempleId(loginId, templeId);
			return false;
		} else {
			TempleEntity TempleEntity = tr.findById(templeId).orElseThrow(()-> new EntityNotFoundException("존재하지 않는 데이터입니다."));
			
			FavoriteTempleEntity favoriteTempleEntity = FavoriteTempleEntity.builder()
					.loginId(loginId)
					.temple(TempleEntity)
					.build();
			ftr.save(favoriteTempleEntity);
			return true;
		}
	}
	
	/**
	 * 즐겨찾기 여부(확인용)
	 * @param loginId
	 * @param templeId
	 * @return ftr.existsByLoginIdAndTemple_TempleId(loginId, templeId);
	 */
	public boolean isFavoriteTemple(String loginId, Long templeId) {
		return ftr.existsByLoginIdAndTemple_TempleId(loginId, templeId);
	}
	
	/**
	 * 마이페이지 즐겨찾기 목록
	 * @param loginId
	 * @return ftr.findByLoginId(loginId);
	 */
	public List<FavoriteTempleEntity> getMyFavoriteTemple(String loginId) {
		return ftr.findByLoginId(loginId);
	}

	/**
	 * 지도/목록 화면에서 사찰마다 즐겨찾기 여부(favorited)를 표시할 때 씀 - 사찰 수만큼 exists 쿼리를
	 * 반복하지 않도록 한 번에 즐겨찾기한 temple_id만 Set으로 뽑아둔다. 비로그인이면 빈 Set 반환.
	 */
	public Set<Long> favoritedIds(String loginId) {
		if (loginId == null) {
			return Set.of();
		}
		return ftr.findFavoritedTempleIds(loginId);
	}

	/** 마이페이지 관심사찰 화면용 - Entity가 아니라 화면에 바로 쓸 수 있는 TempleDTO 리스트로 반환. */
	public List<TempleDTO> getFavorites(String loginId) {
		return getMyFavoriteTemple(loginId).stream()
				.map(favorite -> {
					TempleDTO dto = ts.getInfo(favorite.getTemple().getTempleId());
					dto.setFavorited(true);
					return dto;
				})
				.toList();
	}
}
