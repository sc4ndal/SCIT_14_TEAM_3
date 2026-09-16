package net.datasa.scit_14_3.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * 탈퇴 유예기간(withdrawalPending=true) 중인 회원이 로그인하면, 탈퇴 철회 화면
 * (/mypage/withdrawal/pending) 외에는 아무 것도 못 하게 막는다. 유예기간 중에 사이트를
 * 평소처럼 쓸 수 있게 두면 "탈퇴 신청 = 사실상 취소"가 돼버려서 신청 자체가 무의미해짐.
 *
 * WebSecurityConfig에서 UsernamePasswordAuthenticationFilter 뒤에 등록 - 인증(SecurityContext
 * 확정) 이후에 돌아야 principal을 읽을 수 있다.
 */
@Component
public class WithdrawalGateFilter extends OncePerRequestFilter {

	// 이 경로들은 탈퇴 유예기간 중에도 그대로 둠 - 철회/로그아웃 화면 자체와 정적 리소스.
	private static final List<String> ALLOWED_PREFIXES = List.of(
			"/mypage/withdrawal",
			"/logout",
			"/css/",
			"/js/",
			"/images/",
			"/favicon.ico"
	);

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails principal
				&& principal.isWithdrawalPending()) {
			String uri = request.getRequestURI();
			boolean allowed = ALLOWED_PREFIXES.stream().anyMatch(uri::startsWith);
			if (!allowed) {
				response.sendRedirect(request.getContextPath() + "/mypage/withdrawal/pending");
				return;
			}
		}

		filterChain.doFilter(request, response);
	}
}
