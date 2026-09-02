package net.datasa.scit_14_3.service.temple;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.temple.TempleDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayProgramEntity;
import net.datasa.scit_14_3.repository.temple.TempleRegistrationRequestRepository;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import org.springframework.dao.DataIntegrityViolationException;
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
	private final TempleRegistrationRequestRepository requestRepository;
	private final PasswordEncoder passwordEncoder;

	public boolean isLoginIdAvailable(String loginId) {
		return !tr.existsByLoginId(loginId);
	}

	/** 사찰 등록 요청 승인 시 호출. loginId/rawPassword는 컨트롤러가 무작위로 만들어서 넘기고,
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
				.refundPolicy(dto.getRefundPolicy())
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
				.refundPolicy(entity.getRefundPolicy())
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
					.refundPolicy(entity.getRefundPolicy())
					.build();
			dtoList.add(dto);
		}
		return dtoList;
	}

	// ================= 사이트 관리자 - 사찰관리 =================

	/** 관리자 사찰관리 목록/수정화면 전용 - loginId까지 같이 내려줌(관리자만 보는 화면이라 노출 무방). */
	public List<TempleDTO> getAllForAdmin() {
		List<TempleDTO> dtoList = new ArrayList<>();
		for (TempleEntity entity : tr.findAll()) {
			dtoList.add(toAdminDto(entity));
		}
		return dtoList;
	}

	public TempleDTO getInfoForAdmin(Long templeId) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		return toAdminDto(entity);
	}

	/** loginId/password/mustChangePassword는 여기서 안 건드림 - 계정 자체가 아니라 사찰 정보만 수정. */
	@Transactional
	public void updateAdmin(Long templeId, TempleDTO dto) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));

		entity.setName(dto.getName());
		entity.setImageUrl(dto.getImageUrl());
		entity.setAddress(dto.getAddress());
		entity.setLatitude(dto.getLatitude());
		entity.setLongitude(dto.getLongitude());
		entity.setRegion(dto.getRegion());
		entity.setSupportSea(dto.isSupportSea());
		entity.setSupportMountain(dto.isSupportMountain());
		entity.setSupportRiver(dto.isSupportRiver());
		entity.setSupportUrban(dto.isSupportUrban());
		entity.setSupportEnglish(dto.isSupportEnglish());
		// specialNotice(유의사항)/refundPolicy는 여기서 안 건드림 - 사찰 계정 본인이
		// updateOwnInfo()로 직접 관리(관리자 화면에 폼 자체가 없음, 문제 일으킬 값이 아니라서).
	}

	/** 사찰 계정 본인이 마이페이지(사찰정보수정)에서 직접 수정 가능한 값들만 - 이름/주소/위치/지역/
	    장소유형처럼 잘못 넣으면 지도 등이 꼬이는 값은 빠져있음(그런 값은 등록 시 검증된 뒤로 고정,
	    변경 필요하면 문의). 대표이미지/영어지원여부/환불규정/유의사항은 사찰 본인이 제일 잘 아는
	    값이라 문제를 일으킬 여지가 없어서 자유롭게 수정 가능. specialNotice가 프로그램 상세의
	    "유의사항"으로도 그대로 쓰임(별도 컬럼 안 둠). */
	@Transactional
	public void updateOwnInfo(Long templeId, String imageUrl, boolean supportEnglish, String refundPolicy, String specialNotice) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		entity.setImageUrl(imageUrl);
		entity.setSupportEnglish(supportEnglish);
		entity.setRefundPolicy(refundPolicy);
		entity.setSpecialNotice(specialNotice);
	}

	/** 사찰 계정 본인이 등록된 대표 이미지를 삭제. Cloudinary에 올라간 실제 파일은 안 지움(새
	    이미지로 교체할 때도 기존 파일 정리 안 하는 기존 방식과 동일 - DB 참조만 비움). */
	@Transactional
	public void removeImage(Long templeId) {
		TempleEntity entity = tr.findById(templeId).orElseThrow(() -> new EntityNotFoundException("해당되는 데이터가 존재하지 않습니다."));
		entity.setImageUrl(null);
	}

	/** 등록 취소/삭제. 이 사찰을 만들었던 과거 승인 요청 기록(TEMPLE_REGISTRATION_REQUEST)은
	    지우지 않고 approved_temple_id 연결만 끊어줌 - 그래야 요청 기록 자체는 남아있으면서
	    TEMPLE 행 삭제 시 외래키 제약에 안 걸림. 프로그램/예약 등 다른 데이터가 남아있으면
	    그건 그대로 실패시킴(무작정 같이 지우면 위험한 데이터라 관리자가 먼저 정리해야 함).*/
	@Transactional
	public void delete(Long templeId) {
		List<net.datasa.scit_14_3.domain.entity.templeRequest.TempleRegistrationRequestEntity> linkedRequests =
				requestRepository.findByApprovedTempleId(templeId);
		linkedRequests.forEach(r -> r.setApprovedTempleId(null));

		try {
			tr.deleteById(templeId);
		} catch (DataIntegrityViolationException e) {
			throw new IllegalStateException("이 사찰에 연결된 프로그램/예약 등의 데이터가 있어 삭제할 수 없습니다.");
		}
	}

	private TempleDTO toAdminDto(TempleEntity entity) {
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
				.loginId(entity.getLoginId())
				.mustChangePassword(entity.isMustChangePassword())
				.build();
	}
}
