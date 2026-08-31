package net.datasa.scit_14_3.domain.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocalSignupRequestDto {
    private String loginId;
    private String password;
    private String nickname; // 법명
    private String name;     // 여권 영문 이름 형식
    private String phone;
    private String email;
}
