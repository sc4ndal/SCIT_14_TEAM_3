package net.datasa.scit_14_3.security;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.user.KakaoOAuthService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.List;

/*
	시큐리티 환경설정 클래스
	(기존 WebSecurityConfig에 아래 3가지만 추가된 버전 - 나머지는 원본 그대로)
	  1) /admin/** ROLE_ADMIN 제한
	  2) /login/**, /signup/** 하위 경로까지 전부 공개 (카카오 콜백, 추가정보 제출 등 포함)
	  3) securityContextRepository 빈 노출 (SessionLoginService가 카카오 로그인 시
	     세션에 직접 인증 정보를 저장할 때 재사용)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

	private final KakaoOAuthService kakaoOAuthService;

	// 로그인 없이 접근 가능한 경로
	private static final List<String> PUBLIC_URLS = List.of(
			"/",
			"/favicon.ico",
			"/css/**",
			"/js/**",
			"/images/**",
			"/error",
			"/error/**",
			"/login/**",           // /login, /login/kakao, /login/kakao/callback 전부 포함
			"/signupSelect/**",
			"/signup/**",          // /signup, /signup/local, /signup/kakao-additional 전부 포함
			"/api/check/**",       // 아이디/닉네임/이메일 중복확인 (가입 전, 미로그인 상태에서 호출)
			"/api/email/**",       // 이메일 인증코드 발송/확인 (가입 전, 미로그인 상태에서 호출)
			"/api/location-type/**", // 사찰 등록 문의 폼(공개)의 장소 유형 AI 자동판별
			"/temples/**",
			"/templestayprograms/**",
			"/templestayreservations/**",
			"/reservationparticipants/**",
			"/payments/**",
			"/reservation/**",
			"/maptest/**",
			"/info/**",
			"/temple-requests/**",    // 사찰 관계자가 회원가입 없이 남기는 등록 요청 (공개)
			"/reservation",
			"/api/temples",
			"/api/templestayprograms/**",
			"/maptemplestayviews/**",
			"/findtemple",
			"/templestayGuide",
			"/templestayprograms/**",
			"/etiquette-simulation"
	);
	
	@Bean
	protected SecurityFilterChain config(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)		// 개발 편의를 위해 비활성화
				
				.securityContext(sc -> sc.securityContextRepository(securityContextRepository()))
				
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(PUBLIC_URLS.toArray(String[]::new)).permitAll()
						.requestMatchers("/admin/**").hasRole("ADMIN")
						.anyRequest().authenticated()
				)
				
				.formLogin(formLogin -> formLogin
						.loginPage("/login")
						// 관리자가 임시 비밀번호로 발급한 사찰 계정은 로그인하자마자 비밀번호부터 바꾸게 함
						.successHandler((request, response, authentication) -> {
							String target = "/";
							if (authentication.getPrincipal() instanceof AppUserDetails principal
									&& principal.isMustChangePassword()) {
								target = "/mypage/edit";
							}
							response.sendRedirect(request.getContextPath() + target);
						})
						.permitAll()
				)
				
				.logout(logout -> logout
						// 카카오 계정으로 로그인한 사람이면, 세션에 들고 있던 카카오 액세스 토큰으로
						// 카카오 REST API 로그아웃을 먼저 호출함(브라우저 화면 안 거치고 서버 대 서버로
						// 바로 처리됨) - 안 그러면 우리 세션만 지워지고 카카오 쪽은 로그인 상태로 남아서
						// 다음에 카카오 로그인 눌렀을 때 인증 절차 없이 바로 통과돼버림.
						// addLogoutHandler로 추가한 핸들러는 세션이 invalidate되기 전에 먼저 실행됨.
						.addLogoutHandler((request, response, authentication) -> {
							if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails principal) {
								String accessToken = principal.getKakaoAccessToken();
								if (accessToken != null) {
									kakaoOAuthService.logout(accessToken);
								}
							}
						})
						.logoutSuccessUrl("/")
				);


		
		return http.build();
	}
	
	@Bean
	public SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}
	
	@Bean
	public BCryptPasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
