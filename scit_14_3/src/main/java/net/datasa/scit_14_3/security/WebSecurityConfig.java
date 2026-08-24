package net.datasa.scit_14_3.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.List;

/*
	시큐리티 환경설정 클래스
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

	// 로그인 없이 접근 가능한 경로
	private static final List<String> PUBLIC_URLS = List.of(
			"/",
			"/login",
			"/css/**",
			"/member/join",
			"/product/list"
	);

	@Bean
	protected SecurityFilterChain config(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)		// 개발 편의를 위해 비활성화

				.authorizeHttpRequests(auth -> auth
						.requestMatchers(PUBLIC_URLS.toArray(String[]::new)).permitAll()
						.anyRequest().authenticated()
				)

				.formLogin(formLogin -> formLogin
						.loginPage("/login")
						.defaultSuccessUrl("/product/list", true)
						.permitAll()
				)

				.logout(logout -> logout
						.logoutSuccessUrl("/product/list")
				);

		return http.build();
	}

	@Bean
	public BCryptPasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
