package net.datasa.scit_14_3.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.user.UserResponseDto;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 카카오 로그인처럼 "이미 신원 확인이 끝난" 상황에서, 폼로그인(아이디/비밀번호 검증) 절차 없이
 * 바로 로그인 세션을 만들어주기 위한 헬퍼.
 */
@Component
@RequiredArgsConstructor
public class SessionLoginService {

    private final SecurityContextRepository securityContextRepository;

    public void loginAs(UserResponseDto user, HttpServletRequest request, HttpServletResponse response) {
        loginAs(user, null, request, response);
    }

    /** 카카오 로그인용. kakaoAccessToken을 principal에 실어두면, 나중에 로그아웃할 때
        세션을 거치지 않고 Authentication에서 바로 꺼내 쓸 수 있음(세션 invalidate 순서에 안 걸림). */
    public void loginAs(UserResponseDto user, String kakaoAccessToken,
                         HttpServletRequest request, HttpServletResponse response) {
        AppUserDetails principal = new AppUserDetails(
                user.getLoginId(),
                null,
//                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                null, // 사찰 계정이 아니므로 templeId 없음
                user.getNickname(),
                kakaoAccessToken,
                false// 사찰 계정이 아니므로 비밀번호 강제변경 대상 아님
        );

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // 이게 없으면 이번 요청에서만 로그인된 것처럼 보이고 다음 요청부터 다시 로그아웃 상태가 됨
        securityContextRepository.saveContext(context, request, response);
    }
}
