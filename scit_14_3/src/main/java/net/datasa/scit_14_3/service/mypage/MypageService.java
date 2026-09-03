package net.datasa.scit_14_3.service.mypage;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.mypage.MypageEditViewDto;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 마이페이지(일반 USER 회원) 관련 조회/처리.
 * 사찰(TEMPLE) 계정의 비밀번호 변경 등은 {@code TempleService} 쪽에서 따로 다룬다.
 */
@Service
@RequiredArgsConstructor
public class MypageService {

	private final UserRepository userRepository;

	/**
	 * 회원정보수정(/mypage/edit) 화면에 필요한 값만 조회해서 뷰 DTO로 변환한다.
	 *
	 * @param loginId 로그인한 회원의 아이디(= principal.getUsername())
	 * @throws EntityNotFoundException USER 테이블에 없는 계정(예: 사찰 계정)으로 호출된 경우
	 */
	@Transactional(readOnly = true)
	public MypageEditViewDto getEditView(String loginId) {
		UserEntity user = userRepository.findById(loginId)
				.orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다: " + loginId));
		return MypageEditViewDto.from(user);
	}
}
