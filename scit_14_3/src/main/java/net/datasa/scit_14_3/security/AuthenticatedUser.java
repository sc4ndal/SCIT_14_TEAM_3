//package net.datasa.scit_14_3.security;
//
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.userdetails.UserDetails;
//
//import java.util.Collection;
//import java.util.Collections;
//
///*
//	회원 인증 정보 객체 - Spring Security가 로그인 처리에 사용하는 표준 UserDetails 구현체
// */
//@Builder
//@Getter
//@NoArgsConstructor
//@AllArgsConstructor
//public class AuthenticatedUser implements UserDetails {
//
//	private String id;
//	private String password;
//	private String name;
//	private String memberType;		// B2C / B2B
//	private String roleName;
//
//	@Override
//	public Collection<? extends GrantedAuthority> getAuthorities() {
//		return Collections.singleton(new SimpleGrantedAuthority(roleName));
//	}
//
//	@Override
//	public String getUsername() {
//		return id;
//	}
//
//	@Override
//	public String getPassword() {
//		return password;
//	}
//}
