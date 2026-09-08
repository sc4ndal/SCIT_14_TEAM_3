package net.datasa.scit_14_3.service.temple;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.entity.temple.FavoriteTempleEntity;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.repository.temple.FavoriteTempleRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
