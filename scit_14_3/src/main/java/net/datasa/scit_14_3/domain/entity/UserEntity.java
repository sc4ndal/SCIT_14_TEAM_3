package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "USER")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    @Column(name = "login_id", length = 30)
    private String loginId; // '@' 시작 불가 (CHECK 제약, DB에서 강제)

    @Column(length = 255)
    private String password; // BCrypt 해시. 카카오 회원은 null

    @Column(nullable = false, unique = true, length = 30)
    private String nickname; // 법명, 가입 후 수정 불가(애플리케이션 레벨 규칙)

    @Column(nullable = false, length = 150)
    private String name; // 여권 영문 이름 형식(내국인은 별도 표기 규칙 - signup.js에서 처리)

    @Column(length = 20)
    private String phone;

    @Column(unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "login_type", nullable = false)
    private LoginType loginType = LoginType.LOCAL;

    public enum Role { USER, ADMIN }
    public enum LoginType { LOCAL, KAKAO }
}
