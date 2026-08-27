package net.datasa.scit_14_3.service;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

/**
 * 회원가입 이메일 인증. 코드/만료시간/인증완료 여부는 DB가 아니라 세션에만 보관한다
 * (카카오 로그인의 pendingKakaoId와 같은 패턴 - 가입 전 임시 상태라 세션이면 충분함).
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    private static final String CODE_KEY = "emailVerifyCode";
    private static final String TARGET_KEY = "emailVerifyTarget";
    private static final String EXPIRES_KEY = "emailVerifyExpiresAt";
    private static final String VERIFIED_KEY = "emailVerifiedFor";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);

    public void sendVerificationCode(String email, HttpSession session) {
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        session.setAttribute(CODE_KEY, code);
        session.setAttribute(TARGET_KEY, email);
        session.setAttribute(EXPIRES_KEY, Instant.now().plus(CODE_TTL));
        session.removeAttribute(VERIFIED_KEY);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[사찰 커뮤니티] 이메일 인증번호");
        message.setText("인증번호: " + code + "\n5분 이내에 입력해주세요.");
        mailSender.send(message);
    }

    public boolean verifyCode(String email, String code, HttpSession session) {
        String savedCode = (String) session.getAttribute(CODE_KEY);
        String savedTarget = (String) session.getAttribute(TARGET_KEY);
        Instant expiresAt = (Instant) session.getAttribute(EXPIRES_KEY);

        boolean ok = savedCode != null
                && savedCode.equals(code)
                && savedTarget != null && savedTarget.equals(email)
                && expiresAt != null && Instant.now().isBefore(expiresAt);

        if (ok) {
            session.setAttribute(VERIFIED_KEY, email);
            session.removeAttribute(CODE_KEY);
        }
        return ok;
    }

    /** registerLocal() 직전에 서버가 직접 확인하는 용도. 클라이언트가 보낸 email_verified 값은 안 믿음. */
    public boolean isVerified(String email, HttpSession session) {
        return email != null && email.equals(session.getAttribute(VERIFIED_KEY));
    }
}
