package net.datasa.scit_14_3.domain.dto;

import lombok.Getter;
import lombok.Setter;

/** 카카오 최초 로그인 시 추가 정보 입력. login_id(카카오 회원번호)는 세션(pendingKakaoId)에서만
 *  가져오고 폼 입력으로는 절대 받지 않는다 - 클라이언트가 다른 카카오 계정인 척 조작하는 것 방지. */
@Getter
@Setter
public class KakaoAdditionalRequestDto {
    private String nickname; // 법명
    private String name;     // 여권 영문 이름 형식
    private String phone;
    private String email;
}
