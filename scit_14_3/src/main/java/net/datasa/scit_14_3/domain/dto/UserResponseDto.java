package net.datasa.scit_14_3.domain.dto;

import lombok.Builder;
import lombok.Getter;
import net.datasa.scit_14_3.domain.entity.UserEntity;

/** 컨트롤러가 UserEntity를 직접 다루지 않도록 Service가 돌려주는 응답용 DTO. */
@Getter
@Builder
public class UserResponseDto {
    private String loginId;
//    private String password;
    private String nickname;
    private String name;
    private String phone;
    private String email;
    private UserEntity.Role role;
    private UserEntity.LoginType loginType;
}
