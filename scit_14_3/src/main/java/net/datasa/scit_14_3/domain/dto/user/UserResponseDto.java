package net.datasa.scit_14_3.domain.dto.user;

import lombok.Builder;
import lombok.Getter;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;

import java.time.LocalDateTime;

/** 컨트롤러가 UserEntity를 직접 다루지 않도록 Service가 돌려주는 응답용 DTO. */
@Getter
@Builder
public class UserResponseDto {
    private String loginId;
    private String nickname;
    private String name;
    private String phone;
    private String email;
    private UserEntity.Role role;
    private UserEntity.LoginType loginType;
    private LocalDateTime withdrawalRequestedAt; // null이 아니면 탈퇴 유예기간 중
    private LocalDateTime withdrawnAt; // null이 아니면 탈퇴 확정(익명화)됨 - 로그인 불가
}
