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

    public AppUserDetails(String loginId, String password,
                           Collection<? extends GrantedAuthority> authorities,
                           Long templeId) {
        this.loginId = loginId;
        this.password = password;
        this.authorities = authorities;
        this.templeId = templeId;
    }

    public Long getTempleId() {
        return templeId;
    }

    public boolean isTempleAccount() {
        return templeId != null;
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
    public boolean isEnabled() { return true; }
}
