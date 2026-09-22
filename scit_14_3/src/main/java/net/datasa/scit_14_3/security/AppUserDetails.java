package net.datasa.scit_14_3.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * USER 테이블 회원과 TEMPLE 테이블 사찰 계정을 동일한 인증 principal로 다루기 위한 래퍼.
 * getTempleId()는 사찰 계정으로 로그인했을 때만 값이 있고, 일반 회원/사이트관리자는 null.
 *
 * 컨트롤러에서 로그인한 사용자 정보가 필요하면:
 *   @AuthenticationPrincipal AppUserDetails principal
 * 로 받으면 됩니다.
 */
public class AppUserDetails implements UserDetails {

    private final String loginId;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final Long templeId; // 사찰 계정 로그인일 때만 값 존재, 그 외엔 null
    private final String nickname; // 헤더에 표시할 이름 - 일반회원은 법명, 사찰계정은 사찰명
    private final String kakaoAccessToken; // 카카오 로그인일 때만 값 존재 - 로그아웃 시 카카오 REST API 로그아웃 호출용
    private final boolean mustChangePassword; // 관리자가 임시 비밀번호를 발급한 사찰 계정만 true - 로그인 성공 시 비밀번호 변경 페이지로 강제 이동시키는 데 씀
    private final boolean withdrawalPending; // 탈퇴 유예기간 중인 일반회원만 true - 로그인 성공 시 철회 화면으로 강제 이동시키고,
                                              // WithdrawalGateFilter가 그 화면 외 다른 곳 접근을 막는 데 씀
    private final boolean enabled; // 탈퇴 확정(익명화)된 회원만 false - UserDetails 표준 훅이라
                                    // 폼로그인은 DaoAuthenticationProvider가 비밀번호 검사보다 먼저 자동으로
                                    // 막아준다(preAuthenticationChecks). 카카오 로그인처럼 그 경로를 안 타는
                                    // 곳은 SessionLoginService.loginAs가 이 값을 직접 확인해서 막는다 -
                                    // "탈퇴 계정 로그인 차단"을 한 곳(이 필드)만 보면 되게 하기 위함.

    /** 사찰 계정 로그인 전용 — 탈퇴 유예/확정 개념이 없어 항상 (false, true)로 고정. */
    public AppUserDetails(String loginId, String password,
                           Collection<? extends GrantedAuthority> authorities,
                           Long templeId, String nickname, String kakaoAccessToken,
                           boolean mustChangePassword) {
        this(loginId, password, authorities, templeId, nickname, kakaoAccessToken, mustChangePassword, false, true);
    }
	/** 회원 계정 */
    public AppUserDetails(String loginId, String password,
                           Collection<? extends GrantedAuthority> authorities,
                           Long templeId, String nickname, String kakaoAccessToken,
                           boolean mustChangePassword, boolean withdrawalPending, boolean enabled) {
        this.loginId = loginId;
        this.password = password;
        this.authorities = authorities;
        this.templeId = templeId;
        this.nickname = nickname;
        this.kakaoAccessToken = kakaoAccessToken;
        this.mustChangePassword = mustChangePassword;
        this.withdrawalPending = withdrawalPending;
        this.enabled = enabled;
    }

    public Long getTempleId() {
        return templeId;
    }

    public String getNickname() {
        return nickname;
    }

    public String getKakaoAccessToken() {
        return kakaoAccessToken;
    }

    public boolean isTempleAccount() {
        return templeId != null;
    }

    public boolean isAdmin() {
        return authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public boolean isWithdrawalPending() {
        return withdrawalPending;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return loginId;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return enabled; }
    
}
