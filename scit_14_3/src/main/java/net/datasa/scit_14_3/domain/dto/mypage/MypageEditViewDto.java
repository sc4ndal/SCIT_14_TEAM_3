package net.datasa.scit_14_3.domain.dto.mypage;

import lombok.Builder;
import lombok.Getter;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;

/**
 * 마이페이지 &gt; 회원정보수정(/mypage/edit) 화면 전용 뷰 DTO.
 *
 * <p>화면에 실제로 뿌리는 값만 담는다. password(BCrypt 해시)·카카오 액세스 토큰 등
 * 민감정보는 절대 포함하지 않는다 — 뷰에서 {@code ${user.password}} 같은 접근 자체가 불가능하도록.
 *
 * <p>{@code pendingEmail}은 "이메일 변경 인증 대기" 상태를 나타내는 값인데, 해당 플로우/컬럼이
 * 아직 없어 현재는 항상 {@code null}이다. 인증 메일 방식이 구현되면 그때 채운다.
 */
@Getter
@Builder
public class MypageEditViewDto {

	private final String loginId;   // 로그인 아이디 (PK, 변경 불가)
	private final String name;      // 실명(여권 영문), 본인 수정 불가
	private final String nickname;  // 법명, 본인 수정 가능
	private final String phone;     // 연락처, 본인 수정 가능
	private final String email;     // 현재 이메일 (없을 수 있음 - null)
	private final String pendingEmail; // 변경 대기 중인 이메일 (미구현 - 현재 항상 null)

	private final String loginType;   // "LOCAL" | "KAKAO" (템플릿 뱃지 표시용)
	private final boolean localMember; // LOCAL 회원만 비밀번호 변경 섹션/본인확인 노출

	public static MypageEditViewDto from(UserEntity user) {
		UserEntity.LoginType type = user.getLoginType();
		return MypageEditViewDto.builder()
				.loginId(user.getLoginId())
				.name(user.getName())
				.nickname(user.getNickname())
				.phone(user.getPhone())
				.email(user.getEmail())
				.pendingEmail(null)
				.loginType(type.name())
				.localMember(type == UserEntity.LoginType.LOCAL)
				.build();
	}
}
