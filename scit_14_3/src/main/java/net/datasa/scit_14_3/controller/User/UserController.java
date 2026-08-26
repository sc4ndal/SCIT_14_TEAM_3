package net.datasa.scit_14_3.controller.User;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@Controller

public class UserController {
	
	@GetMapping("/login")
	public String login(){
		return "login";
	}
	
	@GetMapping("/signupSelect")
	public String signupSelect(){
		return "signupSelect";
	}
	
	@GetMapping("/signup")
	public String signup(@RequestParam(required = false) String mode, Model model) {
		model.addAttribute("mode", mode);  // "local" 또는 "kakao" 또는 null
		return "signup";
	}
	
	/*
	@PostMapping("/signup/local")
public String localSignup(@ModelAttribute LocalSignupRequest request) {
    Member member = Member.builder()
            .loginId(request.getLoginId())
            .password(passwordEncoder.encode(request.getPassword()))
            .loginType(LoginType.LOCAL)   // ← 클라이언트한테 안 물어보고, 이 메서드 자체가 LOCAL임을 이미 알고 있음
            .nickname(request.getNickname())
            // ...
            .build();
    memberRepository.save(member);
    return "redirect:/";
}

@PostMapping("/signup/kakao-additional")
public String kakaoAdditionalSignup(@ModelAttribute KakaoAdditionalRequest request, HttpSession session) {
    Member member = Member.builder()
            .loginId(...)
            .loginType(LoginType.KAKAO)  // ← 이 메서드는 애초에 카카오용이니 여기도 하드코딩
            // ...
            .build();
    memberRepository.save(member);
    return "redirect:/";
}
@PostMapping("/signup/kakao-additional")
public String kakaoAdditionalSignup(@ModelAttribute KakaoAdditionalRequest request, HttpSession session) {
    String kakaoId = (String) session.getAttribute("pendingKakaoId");  // 폼이 아니라 세션에서
    if (kakaoId == null) {
        throw new IllegalStateException("카카오 인증 세션이 없습니다");  // 세션 없이 직접 이 주소로 접근하는 것도 방어
    }
    // ...
}
	 */
}
