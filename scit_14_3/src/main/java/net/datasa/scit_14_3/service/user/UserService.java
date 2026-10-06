package net.datasa.scit_14_3.service.user;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.dto.user.KakaoAdditionalRequestDto;
import net.datasa.scit_14_3.domain.dto.user.LocalSignupRequestDto;
import net.datasa.scit_14_3.domain.dto.user.UserResponseDto;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.exception.DuplicateFieldException;
import net.datasa.scit_14_3.repository.inquiry.InquiryRepository;
import net.datasa.scit_14_3.repository.inquiry.TempleInquiryRepository;
import net.datasa.scit_14_3.repository.templestay.FavoriteReviewRepository;
import net.datasa.scit_14_3.repository.templestay.FavoriteReviewRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayReservationRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayReviewRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    // 탈퇴 신청 후 실제로 확정(익명화) 처리되기까지의 유예기간 - 그 안에 로그인하면 철회 가능
    public static final int WITHDRAWAL_GRACE_PERIOD_DAYS = 30;

    // 삭제된 회원의 예약/후기를 넘겨받는 "탈퇴한 회원" 전용 계정의 아이디 - 이 아이디로는 가입도 로그인도 못 한다.
    public static final String WITHDRAWN_PLACEHOLDER_ID = "withdrawn_user";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TempleStayReservationRepository reservationRepository;
    private final TempleStayReviewRepository reviewRepository;
    private final FavoriteReviewRepository favoriteReviewRepository;
    private final InquiryRepository inquiryRepository;
    private final TempleInquiryRepository templeInquiryRepository;

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
                .filter(u -> u.getRole() == UserEntity.Role.USER && !WITHDRAWN_PLACEHOLDER_ID.equals(u.getLoginId()))
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

        // phone 컬럼이 VARCHAR(20)이라 넘으면 저장 시점에 500으로 터진다 - 안내 메시지로 돌려준다.
        if (phone != null && phone.length() > 20) {
            throw new IllegalStateException("전화번호는 20자 이하로 입력해주세요.");
        }

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

    /** 관리자 회원 삭제 - 탈퇴 확정과 같은 erase()로 처리한다.
        @return 예약/후기 기록이 있어서 "탈퇴한 회원" 계정으로 넘겼으면 true, 기록이 없었으면 false */
    @Transactional
    public boolean delete(String loginId) {
        if (WITHDRAWN_PLACEHOLDER_ID.equals(loginId)) {
            throw new IllegalStateException("시스템 계정은 삭제할 수 없습니다.");
        }
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 회원입니다."));
        if (user.getRole() == UserEntity.Role.ADMIN) {
            throw new IllegalStateException("관리자 계정은 삭제할 수 없습니다.");
        }
        return erase(user);
    }

    /** 회원을 실제로 삭제한다 - 탈퇴 유예기간 만료 배치와 관리자 삭제가 같이 쓴다.
        예약/후기는 USER를 NOT NULL FK(ON DELETE CASCADE 아님)로 참조해서 회원을 지우면 막히고, NULL로도 못 바꾼다.
        그래서 그 기록의 주인만 "탈퇴한 회원" 전용 계정(WITHDRAWN_PLACEHOLDER_ID)으로 옮기고 회원 행은 지운다 -
        결제/후기 기록은 남고(작성자는 withdrawnAt이 있는 그 계정이라 화면에 "탈퇴한 회원"으로 표시),
        아이디/법명/이메일은 완전히 비워져서 같은 사람이든 다른 사람이든 다시 가입할 수 있다.
        1:1 문의, 사찰 문의, 즐겨찾기 등은 ON DELETE CASCADE라 회원과 같이 지워진다.
        @return 예약/후기를 "탈퇴한 회원" 계정으로 넘겼으면 true */
    private boolean erase(UserEntity user) {
        String loginId = user.getLoginId();
        boolean hadRecords = reservationRepository.countByLoginId(loginId) > 0 || reviewRepository.countByLoginId(loginId) > 0;
        if (hadRecords) {
            ensureWithdrawnPlaceholder();
            reservationRepository.reassignOwner(loginId, WITHDRAWN_PLACEHOLDER_ID);
            reviewRepository.reassignOwner(loginId, WITHDRAWN_PLACEHOLDER_ID);
        }
        // 이 회원이 누른 좋아요: 좋아요 행만 지우고, 그 리뷰들의 like_count를 남은 행 수로 다시 맞춘다(집계에서 빠지게)
        java.util.Set<Long> likedReviewIds = favoriteReviewRepository.findFavoritedReviewIds(loginId);
        favoriteReviewRepository.deleteAllByLoginId(loginId);
        if (!likedReviewIds.isEmpty()) {
            reviewRepository.refreshLikeCounts(likedReviewIds);
        }
        userRepository.deleteById(loginId);
        return hadRecords;
    }

    /** 삭제된 회원의 예약/후기를 넘겨받는 계정 - 로그인 불가(withdrawnAt 있음), 비밀번호 없음. 없으면 만든다. */
    private void ensureWithdrawnPlaceholder() {
        if (userRepository.existsById(WITHDRAWN_PLACEHOLDER_ID)) {
            return;
        }
        UserEntity placeholder = new UserEntity();
        placeholder.setLoginId(WITHDRAWN_PLACEHOLDER_ID);
        placeholder.setNickname("del_placeholder");
        placeholder.setName("탈퇴한 회원");
        placeholder.setEmail("withdrawn@deleted.local");
        placeholder.setRole(UserEntity.Role.USER);
        placeholder.setLoginType(UserEntity.LoginType.LOCAL);
        placeholder.setWithdrawnAt(LocalDateTime.now());
        userRepository.saveAndFlush(placeholder);
    }

    // ================= 회원 탈퇴 =================
    // 예약/리뷰는 USER를 참조하는 FK가 ON DELETE CASCADE가 아니라서(결제/후기 기록 보존 목적) 그 기록을 "탈퇴한 회원" 전용 계정으로
    // 넘기고 회원을 삭제한다(erase 참고) - "탈퇴 신청 -> 30일 유예 -> 확정 시 삭제" 흐름을 쓴다.
    // 신청 후 유예기간 안에 로그인하면 WithdrawalGateFilter가 철회 화면으로 보낸다.

    /** 마이페이지 탈퇴 신청. 카카오 회원은 비밀번호가 없어 rawPassword를 검사하지 않는다.
        cancelWithdrawal과 대칭적으로, 신청 직후 세션 principal도 바로 새로 고쳐 써야 하므로
        최신 상태를 돌려준다 - 안 그러면 이미 로그인된 세션은 로그아웃하기 전까지 평소처럼
        계속 이용할 수 있게 남아버려서 유예기간 중 이용 제한(WithdrawalGateFilter)이 무의미해진다. */
    @Transactional
    public UserResponseDto requestWithdrawal(String loginId, String rawPassword) {
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원을 찾을 수 없습니다."));

        if (user.getLoginType() == UserEntity.LoginType.LOCAL
                && !passwordEncoder.matches(rawPassword == null ? "" : rawPassword, user.getPassword())) {
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }
        if (user.getWithdrawalRequestedAt() != null) {
            throw new IllegalStateException("이미 탈퇴가 신청되었습니다.");
        }

        user.setWithdrawalRequestedAt(LocalDateTime.now());
        return toResponseDto(user);
    }

    /** 유예기간 중 재로그인해서 탈퇴를 철회 - 세션 principal도 새로 고쳐 써야 하므로 최신 상태를 돌려준다. */
    @Transactional
    public UserResponseDto cancelWithdrawal(String loginId) {
        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원을 찾을 수 없습니다."));

        if (user.getWithdrawalRequestedAt() == null) {
            throw new IllegalStateException("탈퇴 신청 내역이 없습니다.");
        }
        user.setWithdrawalRequestedAt(null);
        return toResponseDto(user);
    }

    /** 유예기간이 끝난 탈퇴 신청을 삭제 처리 - WithdrawalScheduler가 매일 호출한다. 삭제 방식은 erase() 참고.
        예전 방식(익명화만 하고 행을 남김)으로 처리돼 withdrawnAt만 채워진 행도 이 기회에 같이 정리한다. */
    @Transactional
    public int finalizeOverdueWithdrawals() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(WITHDRAWAL_GRACE_PERIOD_DAYS);
        List<UserEntity> targets = new java.util.ArrayList<>(
                userRepository.findByWithdrawalRequestedAtLessThanEqualAndWithdrawnAtIsNull(cutoff));
        userRepository.findByWithdrawnAtIsNotNull().stream()
                .filter(u -> !WITHDRAWN_PLACEHOLDER_ID.equals(u.getLoginId()))
                .forEach(targets::add);

        for (UserEntity user : targets) {
            erase(user);
        }

        if (!targets.isEmpty()) {
            log.info("탈퇴 확정으로 {}명 삭제 처리함", targets.size());
        }
        return targets.size();
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
                .withdrawalRequestedAt(user.getWithdrawalRequestedAt())
                .withdrawnAt(user.getWithdrawnAt())
                .build();
    }
}
