package net.datasa.scit_14_3.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.TempleDTO;
import net.datasa.scit_14_3.domain.dto.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.entity.TempleEntity;
import net.datasa.scit_14_3.domain.entity.TempleStayProgramEntity;
import net.datasa.scit_14_3.repository.TempleRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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
				.imageUrl(entity.getImageUrl())
				.latitude(entity.getLatitude())
				.longitude(entity.getLongitude())
				.address(entity.getAddress())
				.region(entity.getRegion())
				.locationType(entity.getLocationType())
				.supportEnglish(entity.isSupportEnglish())
				.isTemple(entity.isTemple())
				.specialNotice(entity.getSpecialNotice())
				.build();
	}
	
	public List<TempleDTO> getAll() {
		List<TempleDTO> dtoList = new ArrayList<>();
		List<TempleEntity> list = tr.findAll();
		
		for(TempleEntity entity : list) {
			TempleDTO dto = TempleDTO.builder()
					.templeId(entity.getTempleId())
					.name(entity.getName())
					.imageUrl(entity.getImageUrl())
					.latitude(entity.getLatitude())
					.longitude(entity.getLongitude())
					.address(entity.getAddress())
					.region(entity.getRegion())
					.locationType(entity.getLocationType())
					.supportEnglish(entity.isSupportEnglish())
					.isTemple(entity.isTemple())
					.specialNotice(entity.getSpecialNotice())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}
}
