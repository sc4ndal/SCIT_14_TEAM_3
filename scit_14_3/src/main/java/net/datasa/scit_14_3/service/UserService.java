package net.datasa.scit_14_3.service;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.UserResponseDto;
import net.datasa.scit_14_3.domain.entity.UserEntity;
import net.datasa.scit_14_3.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

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
        return !userRepository.existsByEmail(email);
    }

    public Optional<UserResponseDto> findByLoginId(String loginId) {
        return userRepository.findById(loginId).map(this::toResponseDto);
    }

    @Transactional
    public UserResponseDto registerLocal(LocalSignupRequestDto dto) {
        String loginId = dto.getLoginId();

        // DB의 CHECK 제약(로그인 시 첫 글자로 USER/TEMPLE, kakao_ 접두사를 구분)과
        // 동일한 규칙을 서비스 단에서도 먼저 검증해서 친절한 에러 메시지를 준다.
        if (loginId == null || loginId.startsWith("@")) {
            throw new IllegalStateException("아이디는 '@'로 시작할 수 없습니다.");
        }
        if (loginId.startsWith("kakao_")) {
            throw new IllegalStateException("'kakao_'로 시작하는 아이디는 사용할 수 없습니다.");
        }
        if (userRepository.existsById(loginId)) {
            throw new IllegalStateException("이미 사용 중인 아이디입니다.");
        }
        validateNickname(dto.getNickname());
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            validateEmail(dto.getEmail());
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
        validateNickname(dto.getNickname());
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            validateEmail(dto.getEmail());
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
                .password(user.getPassword())
                .nickname(user.getNickname())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .loginType(user.getLoginType())
                .build();
    }

    private void validateNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalStateException("닉네임(법명)을 입력해주세요.");
        }
        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalStateException("이미 사용 중인 닉네임(법명)입니다.");
        }
    }

    private void validateEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("이미 사용 중인 이메일입니다.");
        }
    }
}
