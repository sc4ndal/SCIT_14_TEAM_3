package net.datasa.scit_14_3.security;

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
public class WebSecurityConfig {
	
	// 로그인 없이 접근 가능한 경로
	private static final List<String> PUBLIC_URLS = List.of(
			"/",
			"/css/**",
			"/js/**",
			"/images/**",
			"/login/**",           // /login, /login/kakao, /login/kakao/callback 전부 포함
			"/signupSelect/**",
			"/signup/**",          // /signup, /signup/local, /signup/kakao-additional 전부 포함
			"/temples/**",
			"/templestayprograms/**",
			"/templestayreservations/**",
			"/reservationparticipants/**",
			"/payments/**",
			"/reservation"
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
						.defaultSuccessUrl("/", true)
						.permitAll()
				)
				
				.logout(logout -> logout
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
