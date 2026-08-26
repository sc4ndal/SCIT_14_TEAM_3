package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.domain.entity.TempleEntity;
import net.datasa.scit_14_3.repository.TempleRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleService {
	private final TempleRepository tr;
	
	public TempleDTO getInfo(Long templeId) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		
		return TempleDTO.builder()
				.templeId(entity.getTempleId())
				.name(entity.getName())
				.apiPlaceId(entity.getApiPlaceId())
				.region(entity.getRegion())
				.locationType(entity.getLocationType())
				.supportEnglish(entity.isSupportEnglish())
				.isTemple(entity.isTemple())
				.specialNotice(entity.getSpecialNotice())
				.build();
	}
}
