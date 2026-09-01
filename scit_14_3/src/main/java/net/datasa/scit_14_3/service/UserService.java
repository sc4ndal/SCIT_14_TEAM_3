package net.datasa.scit_14_3.service;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.UserResponseDto;
import net.datasa.scit_14_3.domain.entity.UserEntity;
import net.datasa.scit_14_3.exception.DuplicateFieldException;
import net.datasa.scit_14_3.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.springframework.util.StringUtils.hasText;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ================= 중복확인 (아이디/닉네임/이메일) =================
    
    public boolean isLoginIdAvailable(String loginId) {
        return !userRepository.existsById(loginId);
    }

    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    public boolean isEmailAvailable(String email) {
        // 빈 값으로 물어보면 existsByEmail(null)이 "email IS NULL"로 번역돼서
        // 이메일 없이 가입한 회원 때문에 "사용 중"으로 잘못 답한다.
        if (!hasText(email)) {
            return true;
        }
        return !userRepository.existsByEmail(email);
    }

    public Optional<UserResponseDto> findByLoginId(String loginId) {
        return userRepository.findById(loginId).map(this::toResponseDto);
    }
    /////////////////
//    private void validateLoginId(String loginId) {
//
//        if (loginId == null) {
//            throw new IllegalStateException("아이디를 입력해주세요.");
//        }
//
//        if (loginId.startsWith("@")) {
//            throw new IllegalStateException(
//                    "아이디는 '@'로 시작할 수 없습니다."
//            );
//        }
//
//        if (loginId.startsWith("kakao_")) {
//            throw new IllegalStateException(
//                    "'kakao_'로 시작하는 아이디는 사용할 수 없습니다."
//            );
//        }
//    }

    @Transactional
    public UserResponseDto registerLocal(LocalSignupRequestDto dto) {
        String loginId = dto.getLoginId();

        // DB의 CHECK 제약(로그인 시 첫 글자로 USER/TEMPLE, kakao_ 접두사를 구분)과
        // 동일한 규칙을 서비스 단에서도 먼저 검증해서 친절한 에러 메시지를 준다.
//        if (loginId == null || loginId.startsWith("@")) {
//            throw new IllegalStateException("아이디는 '@'로 시작할 수 없습니다.");
//        }
//        if (loginId.startsWith("kakao_")) {
//            throw new IllegalStateException("'kakao_'로 시작하는 아이디는 사용할 수 없습니다.");
//        }
//        if (userRepository.existsById(loginId)) {
//            throw new IllegalStateException("이미 사용 중인 아이디입니다.");
//        }

        if  (userRepository.existsById(dto.getLoginId())) {
            throw new DuplicateFieldException("이미 가입 완료된 아이디입니다.");
        }
        // 법명(nickname)은 PK(login_id)가 아니라 nickname 컬럼으로 검사해야 한다.
        // existsById로 보면 다른 사람 아이디와 같은 법명만 걸리고, 정작 진짜 법명 중복은
        // 그냥 통과해서 DB UNIQUE 제약에 걸려 500으로 떨어진다.
        if  (userRepository.existsByNickname(dto.getNickname())) {
            throw new DuplicateFieldException("이미 가입 완료된 법명입니다.");
        }
        // 이메일은 선택 입력이라 비어 있을 수 있다. 이때 existsByEmail(null)을 부르면
        // Spring Data가 "email IS NULL"로 번역해서, 이메일 없이 가입한 회원이 한 명이라도
        // 있으면 그 뒤로는 아무도 이메일 없이 가입할 수 없게 된다 - 값이 있을 때만 검사한다.
        if  (hasText(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateFieldException("이미 가입 완료된 이메일입니다.");
        }

        UserEntity user = new UserEntity();
        user.setLoginId(loginId);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname());
        user.setName(dto.getName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setRole(UserEntity.Role.USER);
        user.setLoginType(UserEntity.LoginType.LOCAL);
        return toResponseDto(userRepository.save(user));
    }

    @Transactional
    public UserResponseDto registerKakao(Long kakaoId, KakaoAdditionalRequestDto dto) {
        String loginId = "kakao_" + kakaoId;

        if (userRepository.existsById(loginId)) {
            // 이미 가입된 카카오 계정이 추가정보 폼을 다시 제출한 경우 (중복 제출 방지)
            throw new IllegalStateException("이미 가입된 카카오 계정입니다.");
        }
//        validateNickname(dto.getNickname());
//
//        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
//            validateEmail(dto.getEmail());
//        }
        
        if  (userRepository.existsById(loginId)) {
            throw new DuplicateFieldException("이미 가입 완료된 아이디입니다.");
        }
        // registerLocal과 같은 이유로 nickname 컬럼 기준, 이메일은 값이 있을 때만 검사한다.
        if  (userRepository.existsByNickname(dto.getNickname())) {
            throw new DuplicateFieldException("이미 가입 완료된 법명입니다.");
        }
        if  (hasText(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateFieldException("이미 가입 완료된 이메일입니다.");
        }
        UserEntity user = new UserEntity();
        user.setLoginId(loginId);
        user.setPassword(null); // 카카오 회원은 비밀번호 없음
        user.setNickname(dto.getNickname());
        user.setName(dto.getName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setRole(UserEntity.Role.USER);
        user.setLoginType(UserEntity.LoginType.KAKAO);

        return toResponseDto(userRepository.save(user));
    }

    private UserResponseDto toResponseDto(UserEntity user) {
        return UserResponseDto.builder()
                .loginId(user.getLoginId())
//                .password(user.getPassword())
                .nickname(user.getNickname())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .loginType(user.getLoginType())
                .build();
    }

//    private void validateNickname(String nickname) {
//        if (nickname == null || nickname.isBlank()) {
//            throw new IllegalStateException("닉네임(법명)을 입력해주세요.");
//        }
//        if (userRepository.existsByNickname(nickname)) {
//            throw new IllegalStateException("이미 사용 중인 닉네임(법명)입니다.");
//        }
//    }
//
//    private void validateEmail(String email) {
//        if (userRepository.existsByEmail(email)) {
//            throw new IllegalStateException("이미 사용 중인 이메일입니다.");
//        }
//    }
}
