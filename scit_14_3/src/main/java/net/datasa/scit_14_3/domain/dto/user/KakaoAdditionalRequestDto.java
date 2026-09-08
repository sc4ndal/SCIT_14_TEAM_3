package net.datasa.scit_14_3.domain.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/** 카카오 최초 로그인 시 추가 정보 입력. login_id(카카오 회원번호)는 세션(pendingKakaoId)에서만
 *  가져오고 폼 입력으로는 절대 받지 않는다 - 클라이언트가 다른 카카오 계정인 척 조작하는 것 방지. */
@Getter
@Setter
public class KakaoAdditionalRequestDto {
    
    @NotBlank(message = "닉네임을 입력해주세요.")
    @Pattern(
            regexp = "^[가-힣a-zA-Z\\u4E00-\\u9FFF0-9]{1,10}$",
            message = "닉네임은 한글, 영문, 숫자를 사용하여 1~10자로 입력해주세요."
    )
    private String nickname; // 법명
    private String name;     // 여권 영문 이름 형식
    private String phone;
    private String email;

    // 앞뒤 공백만 있는 값 때문에 패턴 검증이 불필요하게 실패하지 않도록, 바인딩 시점에 먼저
    // 다듬어둔다 - @Setter(Lombok)가 이미 정의된 이 두 개는 건너뛰고 나머지만 생성해준다.
    public void setNickname(String nickname) {
        this.nickname = nickname == null ? null : nickname.trim();
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }
}
