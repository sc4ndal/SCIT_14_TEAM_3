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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleService {
	private final TempleRepository tr;
	private final PasswordEncoder passwordEncoder;

	public boolean isLoginIdAvailable(String loginId) {
		return !tr.existsByLoginId(loginId);
	}

	/** 관리자 사찰 등록폼에서 호출. loginId/rawPassword는 컨트롤러가 무작위로 만들어서 넘기고,
	    비밀번호 해싱은 UserService.registerLocal()과 동일하게 서비스 안에서 처리함. */
	public TempleDTO register(TempleDTO dto, String loginId, String rawPassword) {
		TempleEntity entity = TempleEntity.builder()
				.name(dto.getName())
				.imageUrl(dto.getImageUrl())
				.latitude(dto.getLatitude())
				.longitude(dto.getLongitude())
				.address(dto.getAddress())
				.region(dto.getRegion())
				.supportSea(dto.isSupportSea())
				.supportMountain(dto.isSupportMountain())
				.supportRiver(dto.isSupportRiver())
				.supportUrban(dto.isSupportUrban())
				.supportEnglish(dto.isSupportEnglish())
				.isTemple(true)
				.specialNotice(dto.getSpecialNotice())
				.loginId(loginId)
				.password(passwordEncoder.encode(rawPassword))
				.mustChangePassword(true) // 관리자가 임시 비밀번호를 발급했으므로 다음 로그인 때 변경을 강제함
				.build();

		TempleEntity saved = tr.save(entity);
		dto.setTempleId(saved.getTempleId());
		dto.setLoginId(saved.getLoginId());
		return dto;
	}

	/** 사찰 계정 마이페이지에서 호출. 로그인ID는 인증 로직(@ 접두사)과 얽혀있어 수정 대상에서 뺐고,
	    비밀번호만 본인이 바꿀 수 있게 함 - 관리자가 임시 발급한 비밀번호를 그대로 쓰지 않도록. */
	public void changePassword(Long templeId, String currentPassword, String newPassword) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));

		if (!passwordEncoder.matches(currentPassword, entity.getPassword())) {
			throw new IllegalStateException("현재 비밀번호가 일치하지 않습니다.");
		}

		entity.setPassword(passwordEncoder.encode(newPassword));
		entity.setMustChangePassword(false);
	}

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
				.supportSea(entity.isSupportSea())
				.supportMountain(entity.isSupportMountain())
				.supportRiver(entity.isSupportRiver())
				.supportUrban(entity.isSupportUrban())
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
					.supportSea(entity.isSupportSea())
					.supportMountain(entity.isSupportMountain())
					.supportRiver(entity.isSupportRiver())
					.supportUrban(entity.isSupportUrban())
					.supportEnglish(entity.isSupportEnglish())
					.isTemple(entity.isTemple())
					.specialNotice(entity.getSpecialNotice())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}
}
