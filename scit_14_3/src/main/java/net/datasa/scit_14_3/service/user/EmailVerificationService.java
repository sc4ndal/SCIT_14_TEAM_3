package net.datasa.scit_14_3.service.user;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

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

    /** 아이디 찾기 - DB에 등록된 이메일로 확인되면 인증번호 없이 바로 아이디 원문을 보내준다. */
    public void sendLoginIdMail(String email, String loginId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[사찰 커뮤니티] 아이디 찾기 결과 안내");
        message.setText("가입하신 아이디: " + loginId);
        mailSender.send(message);
    }

    /** 비밀번호 찾기 - DB에 등록된 이메일로 확인되면 재설정 링크(토큰 포함)를 보내준다. */
    public void sendPasswordResetMail(String email, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[사찰 커뮤니티] 비밀번호 재설정 안내");
        message.setText(
                "아래 링크에서 비밀번호를 재설정해주세요.\n" + resetLink +
                "\n\n이 링크는 5분간만 유효합니다."
        );
        mailSender.send(message);
    }

    /** 사찰 등록 요청이 승인됐을 때, 새로 만든 임시 로그인ID/비밀번호를 요청자에게 보냄. */
    public void sendTempleCredentials(String email, String loginId, String rawPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[사찰 커뮤니티] 사찰 계정 등록 완료 안내");
        message.setText(
                "사찰 계정이 등록되었습니다.\n" +
                "아이디: " + loginId + "\n" +
                "임시 비밀번호: " + rawPassword + "\n\n" +
                "로그인 후 반드시 비밀번호를 변경해주세요."
        );
        mailSender.send(message);
    }

    /** 템플스테이 예약(결제까지) 완료 후 대표자에게 보내는 영수증 성격의 안내 메일. */
    public void sendReservationReceipt(String email, Long reservationId, String programTitle, String templeName,
                                        String templeAddress, LocalDate startDate, LocalDate endDate,
                                        int participantCount, int amount, String paymentMethod,
                                        String representativeName, String representativePhone,
                                        BigDecimal latitude, BigDecimal longitude) {
        String dateLine = startDate.equals(endDate) ? startDate + " (당일)" : startDate + " ~ " + endDate;
        // 이미지 없이 링크만 - 이메일 클라이언트가 외부 이미지를 자주 막아서 지도는 클릭해서 여는 링크로 대신함.
        String mapUrl = "https://map.kakao.com/link/map/"
                + URLEncoder.encode(templeName, StandardCharsets.UTF_8) + "," + latitude + "," + longitude;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[사찰 커뮤니티] 템플스테이 예약이 확정되었습니다");
        message.setText(
                "예약이 확정되었습니다. 아래 내용을 확인해주세요.\n\n" +
                "예약번호: " + reservationId + "\n" +
                "프로그램: " + programTitle + "\n" +
                "사찰: " + templeName + " (" + templeAddress + ")\n" +
                "위치 지도: " + mapUrl + "\n" +
                "기간: " + dateLine + "\n" +
                "인원: " + participantCount + "명\n" +
                "대표자: " + representativeName + " (" + representativePhone + ")\n" +
                "결제 수단: " + paymentMethod + "\n" +
                "결제 금액: " + String.format("%,d", amount) + "원\n\n" +
                "예약 내용이 실제와 다르면 마이페이지 > 예약목록에서 취소 후 다시 신청해주세요."
        );
        mailSender.send(message);
    }
}
