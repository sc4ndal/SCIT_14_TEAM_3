package net.datasa.scit_14_3.domain.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

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
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()])[A-Za-z\\d!@#$%^&*()]{8,20}$",
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
    
    
    // 이름: 한글 2~5자
//    @Pattern(
//            regexp = "^[가-힣]{2,5}$",
//            message = "이름은 한글 2~5자로 입력해주세요."
//    )
    @Pattern(
            regexp = "^[A-Za-z\\s]{2,50}$",
            message = "이름은 영문으로 2~50자까지 입력해주세요."
    )
    private String name;     // 여권 영문 이름 형식
    private String phone;
    private String email;
    private String nationality;   // "KR" 또는 "FOREIGN" - 이름 형식 검증 용도로만 사용, DB 미저장
}

