package net.datasa.scit_14_3.service.user;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.user.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.user.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.user.UserResponseDto;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.exception.DuplicateFieldException;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
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

    // ================= 아이디 찾기 / 비밀번호 재설정 (DB 등록 이메일 기준) =================

    public Optional<String> findLoginIdByEmail(String email) {
        // email이 비어있으면 JPA가 "email IS NULL"로 해석해서, 이메일 없이 가입한 계정
        // (ADMIN 등)이 걸려버림 - 그 계정으로 메일을 보내려다 NPE가 나는 문제가 있었음.
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email).map(UserEntity::getLoginId);
    }

    /** 마이페이지 회원정보수정 진입 전 본인확인(비밀번호 재입력)에서 호출. 카카오 회원은
        비밀번호가 없어 이 경로 자체를 안 타므로 여기선 LOCAL 회원만 들어온다고 가정한다. */
    public boolean verifyPassword(String loginId, String rawPassword) {
        return userRepository.findById(loginId)
                .map(user -> passwordEncoder.matches(rawPassword, user.getPassword()))
                .orElse(false);
    }

    /** 비밀번호 재설정 - PasswordResetService가 토큰으로 loginId를 이미 확인한 뒤에만 호출됨. */
    @Transactional
    public void resetPassword(String loginId, String rawPassword) {
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원을 찾을 수 없습니다."));
        user.setPassword(passwordEncoder.encode(rawPassword));
    }

    // ================= 사이트 관리자 - 회원관리 =================

    /** 회원관리 목록 전용 - 사이트 관리자(ADMIN) 계정은 여기서 관리할 대상이 아니라서 뺌. */
    public List<UserResponseDto> getAllRegularUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserEntity.Role.USER)
                .map(this::toResponseDto)
                .toList();
    }

    /** 관리자가 회원 정보를 고칠 때 호출. 아이디(PK)/비밀번호/로그인방식은 여기서 건드리지 않음 -
        닉네임(법명)은 일반회원 본인은 못 바꿔도 관리자는 바꿀 수 있게 허용함. */
    @Transactional
    public void updateAdmin(String loginId, String nickname, String name, String phone, String email, UserEntity.Role role) {
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원을 찾을 수 없습니다."));

        if (!nickname.equals(user.getNickname()) && userRepository.existsByNickname(nickname)) {
            throw new IllegalStateException("이미 사용 중인 법명입니다.");
        }
        if (email != null && !email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new IllegalStateException("이미 사용 중인 이메일입니다.");
        }

        user.setNickname(nickname);
        user.setName(name);
        user.setPhone(phone);
        user.setEmail(email);
        user.setRole(role);
    }

    /** 마이페이지(/mypage/edit) 본인 정보수정. 아이디(PK)/이름은 여기서 안 건드림 - 이름은
        가입 후 수정 불가, 아이디는 애초에 화면에서 읽기전용. newPassword가 null/blank면
        비밀번호는 그대로 둔다 - 컨트롤러가 패턴/일치 검증을 마친 뒤에만 넘겨준다고 가정.
        emailVerified는 email을 실제로 바꾸려는 경우에만 확인함(컨트롤러가 세션에서 직접
        확인해 넘겨줌 - 클라이언트가 보낸 값은 안 믿음, registerLocal과 같은 원칙). */
    @Transactional
    public void updateOwnProfile(String loginId, String nickname, String phone, String email,
                                  String newPassword, boolean emailVerified) {
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원을 찾을 수 없습니다."));

        String trimmedNickname = nickname.trim();
        if (!trimmedNickname.equals(user.getNickname()) && userRepository.existsByNickname(trimmedNickname)) {
            throw new IllegalStateException("이미 사용 중인 법명입니다.");
        }

        boolean emailChanged = email != null && !email.equals(user.getEmail());
        if (emailChanged) {
            if (userRepository.existsByEmail(email)) {
                throw new IllegalStateException("이미 사용 중인 이메일입니다.");
            }
            if (!emailVerified) {
                throw new IllegalStateException("이메일 인증을 완료해주세요.");
            }
        }

        user.setNickname(trimmedNickname);
        user.setPhone(phone);
        user.setEmail(email);

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
    }

    public void delete(String loginId) {
        try {
            userRepository.deleteById(loginId);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("이 회원에게 연결된 예약/리뷰 등의 데이터가 있어 삭제할 수 없습니다.");
        }
    }
    // ================= 회원가입 =================

    @Transactional
    public UserResponseDto registerLocal(LocalSignupRequestDto dto) {
        String loginId = dto.getLoginId();

        if  (userRepository.existsById(dto.getLoginId())) {
            throw new DuplicateFieldException("이미 가입 완료된 아이디입니다.");
        }
        if  (userRepository.existsByNickname(dto.getNickname())) {
            throw new DuplicateFieldException("이미 가입 완료된 법명입니다.");
        }
        if  (userRepository.existsByEmail(dto.getEmail())) {
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

        // 이미 가입된 카카오 계정이 추가정보 폼을 다시 제출한 경우 (중복 제출 방지).
        // DuplicateFieldException으로 던져야 컨트롤러가 잡아서 가입 폼에 메시지를 돌려준다.
        if  (userRepository.existsById(loginId)) {
            throw new DuplicateFieldException("이미 가입된 카카오 계정입니다.");
        }
        if  (userRepository.existsByNickname(dto.getNickname())) {
            throw new DuplicateFieldException("이미 가입 완료된 법명입니다.");
        }
        if  (userRepository.existsByEmail(dto.getEmail())) {
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

    /** 비밀번호는 절대 담지 않는다 - 화면/세션으로 흘러나가면 안 되는 값이라서. */
    private UserResponseDto toResponseDto(UserEntity user) {
        return UserResponseDto.builder()
                .loginId(user.getLoginId())
                .nickname(user.getNickname())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .loginType(user.getLoginType())
                .build();
    }
}
