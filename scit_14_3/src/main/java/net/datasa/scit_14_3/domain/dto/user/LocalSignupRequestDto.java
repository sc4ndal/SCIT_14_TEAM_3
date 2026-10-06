package net.datasa.scit_14_3.domain.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import net.datasa.scit_14_3.util.PasswordPolicy;

@Getter
@Setter
public class LocalSignupRequestDto {

    // 아이디: 영문 + 숫자, 6~20자
    @NotBlank(message = "아이디를 입력해주세요.")
    @Pattern(
            regexp = "^[A-Za-z0-9]{6,20}$",
            message = "아이디는 영문과 숫자를 사용하여 6~20자로 입력해주세요."
    )
    private String loginId;


    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Pattern(
            regexp = PasswordPolicy.REGEX,
            message = "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함하여 8~20자로 입력해주세요."
    )
    private String password;


    // 닉네임: 한글 + 영문  + 숫자, 1~10자
    @NotBlank(message = "닉네임을 입력해주세요.")
    @Pattern(
            regexp = "^[가-힣a-zA-Z\\u4E00-\\u9FFF0-9]{1,10}$",
            message = "닉네임은 한글, 영문, 숫자를 사용하여 1~10자로 입력해주세요."
    )
    private String nickname;


    // 이름: 내국인은 한글 2~5자(공백 없이), 외국인은 영문(로마자) 2~50자 - signup.js의
    // NAME_PATTERN_KR / NAME_PATTERN_FOREIGN과 같은 규칙이다. 서버가 영문만 허용하고 있어서
    // 화면에서 한글 이름이 통과해도 서버에서 거절돼 가입 폼이 초기화되는 문제가 있었다.
    @Pattern(
            regexp = "^([A-Za-z\\s]{2,50}|[가-힣]{2,5})$",
            message = "이름은 한글 2~5자(공백 없이) 또는 영문 2~50자로 입력해주세요."
    )
    private String name;     // 내국인: 한글 이름, 외국인: 여권 영문 이름 형식
    private String phone;
    private String email;
    private String nationality;   // "KR" 또는 "FOREIGN" - 이름 형식 검증 용도로만 사용, DB 미저장

    // 앞뒤 공백만 있는 값 때문에 패턴 검증이 불필요하게 실패하지 않도록, 바인딩 시점에 먼저
    // 다듬어둔다 - @Setter(Lombok)가 이미 정의된 이 두 개는 건너뛰고 나머지만 생성해준다.
    public void setNickname(String nickname) {
        this.nickname = nickname == null ? null : nickname.trim();
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }
}

