//package net.datasa.scit_14_3.security;
//
//import lombok.RequiredArgsConstructor;
//import net.datasa.example2.domain.entity.MemberEntity;
//import net.datasa.example2.repository.MemberRepository;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.stereotype.Service;
//
///*
//	로그인 시 Spring Security가 호출해서 사용자 인증 정보를 조회하는 Service
// */
//@Service
//@RequiredArgsConstructor
//public class AuthenticatedUserDetailsService implements UserDetailsService {
//
//	private final MemberRepository memberRepository;
//
//	@Override
//	public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
//		MemberEntity member = memberRepository.findById(id)
//				.orElseThrow(() -> new UsernameNotFoundException(id + " : 없는 ID입니다."));
//
//		return AuthenticatedUser.builder()
//				.id(member.getMemberId())
//				.password(member.getMemberPassword())
//				.name(member.getMemberName())
//				.memberType(member.getMemberType())
//				.roleName(member.getRolename())
//				.build();
//	}
//}
