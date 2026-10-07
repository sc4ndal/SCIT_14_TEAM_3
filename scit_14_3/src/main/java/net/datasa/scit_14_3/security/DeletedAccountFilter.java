package net.datasa.scit_14_3.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * 로그인해 둔 계정이 그 사이에 삭제됐으면 그 세션을 끊는다.
 * 로그인 정보(AppUserDetails)는 세션 안에 복사본으로 들어 있어서, 관리자 삭제/탈퇴 확정 배치/DB 직접 삭제로 계정이 사라져도
 * 서버는 그걸 모르고 로그인 상태를 계속 인정한다. 요청마다 계정이 아직 있는지 PK로 한 번 확인하고(가벼운 조회), 없으면
 * 세션을 무효화해서 이 요청부터 비로그인으로 처리한다 - 로그인이 필요한 화면은 로그인 페이지로, 공개 화면은 비로그인으로 보인다.
 *
 * WebSecurityConfig에서 인증(SecurityContext 확정) 이후에 돌도록 등록한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeletedAccountFilter extends OncePerRequestFilter {

	// 정적 파일과 웹소켓은 로그인 여부와 상관없어서 건너뛴다(요청마다 DB 조회가 늘지 않게).
	private static final List<String> SKIP_PREFIXES = List.of("/css/", "/js/", "/images/", "/sounds/", "/favicon.ico", "/ws/");

	private final UserRepository userRepository;
	private final TempleRepository templeRepository;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails principal && !isSkipped(request)) {
			boolean exists = true;
			try {
				// 사찰 계정은 TEMPLE 테이블, 일반회원/관리자는 USER 테이블에 로그인 아이디가 있다.
				exists = principal.isTempleAccount()
						? templeRepository.existsByLoginId(principal.getUsername())
						: userRepository.existsById(principal.getUsername());
			} catch (Exception e) {
				// DB 조회가 잠깐 실패했다고 멀쩡한 사용자를 전부 로그아웃시키지 않는다.
				log.warn("계정 존재 확인 실패 - 이번 요청은 그대로 통과시킴 loginId={}", principal.getUsername(), e);
			}

			if (!exists) {
				log.info("삭제된 계정의 세션을 끊음 loginId={}", principal.getUsername());
				SecurityContextHolder.clearContext();
				HttpSession session = request.getSession(false);
				if (session != null) {
					session.invalidate();
				}
			}
		}

		filterChain.doFilter(request, response);
	}

	private boolean isSkipped(HttpServletRequest request) {
		String uri = request.getRequestURI();
		return SKIP_PREFIXES.stream().anyMatch(uri::startsWith);
	}
}
