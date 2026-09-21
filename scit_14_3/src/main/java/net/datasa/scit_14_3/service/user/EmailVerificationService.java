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

    /** 예약 안내 메일은 예약 시점에 저장해둔 화면 언어(ko/ja/en, 그 외는 ko)로 보낸다.
        프로그램명/사찰명/사찰주소는 사찰이 직접 입력한 값이라 번역하지 않고 그대로 넣는다. */
    private static String pick(String lang, String ko, String ja, String en) {
        return "ja".equals(lang) ? ja : "en".equals(lang) ? en : ko;
    }

    private static String dateLine(String lang, LocalDate startDate, LocalDate endDate) {
        return startDate.equals(endDate)
                ? startDate + pick(lang, " (당일)", " (日帰り)", " (day trip)")
                : startDate + " ~ " + endDate;
    }

    private static String peopleText(String lang, int count) {
        return pick(lang, count + "명", count + "名", count + (count == 1 ? " person" : " people"));
    }

    private static String amountText(String lang, int amount) {
        String n = String.format("%,d", amount);
        return pick(lang, n + "원", n + "ウォン", "KRW " + n);
    }

    private static String paymentMethodText(String lang, String method) {
        return switch (method) {
            case "계좌이체" -> pick(lang, method, "銀行振込", "Bank transfer");
            case "카카오페이" -> pick(lang, method, "カカオペイ", "KakaoPay");
            default -> method;
        };
    }

    /** 확정/대기 메일이 공통으로 쓰는 예약 상세 줄들 */
    private static String reservationDetailLines(String lang, Long reservationId, String programTitle, String templeName,
                                                  String templeAddress, LocalDate startDate, LocalDate endDate,
                                                  int participantCount, int amount, String paymentMethod,
                                                  String representativeName, String representativePhone,
                                                  BigDecimal latitude, BigDecimal longitude) {
        // 이미지 없이 링크만 - 이메일 클라이언트가 외부 이미지를 자주 막아서 지도는 클릭해서 여는 링크로 대신함.
        String mapUrl = "https://map.kakao.com/link/map/"
                + URLEncoder.encode(templeName, StandardCharsets.UTF_8) + "," + latitude + "," + longitude;
        return pick(lang, "예약번호: ", "予約番号: ", "Reservation No.: ") + reservationId + "\n" +
                pick(lang, "프로그램: ", "プログラム: ", "Program: ") + programTitle + "\n" +
                pick(lang, "사찰: ", "寺院: ", "Temple: ") + templeName + " (" + templeAddress + ")\n" +
                pick(lang, "위치 지도: ", "位置地図: ", "Map: ") + mapUrl + "\n" +
                pick(lang, "기간: ", "期間: ", "Period: ") + dateLine(lang, startDate, endDate) + "\n" +
                pick(lang, "인원: ", "人数: ", "Participants: ") + peopleText(lang, participantCount) + "\n" +
                pick(lang, "대표자: ", "代表者: ", "Representative: ") + representativeName + " (" + representativePhone + ")\n" +
                pick(lang, "결제 수단: ", "お支払い方法: ", "Payment method: ") + paymentMethodText(lang, paymentMethod) + "\n" +
                pick(lang, "결제 금액: ", "お支払い金額: ", "Amount: ") + amountText(lang, amount) + "\n\n" +
                pick(lang,
                        "예약 내용이 실제와 다르면 마이페이지 > 예약목록에서 취소 후 다시 신청해주세요.",
                        "予約内容が実際と異なる場合は、マイページ > 予約一覧からキャンセルして再度お申し込みください。",
                        "If the details above are incorrect, please cancel from My Page > My Reservations and apply again.");
    }

    /** 템플스테이 예약(결제까지) 완료 후 대표자에게 보내는 영수증 성격의 안내 메일. */
    public void sendReservationReceipt(String email, String lang, Long reservationId, String programTitle, String templeName,
                                        String templeAddress, LocalDate startDate, LocalDate endDate,
                                        int participantCount, int amount, String paymentMethod,
                                        String representativeName, String representativePhone,
                                        BigDecimal latitude, BigDecimal longitude) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(pick(lang,
                "[사찰 커뮤니티] 템플스테이 예약이 확정되었습니다",
                "[寺院コミュニティ] テンプルステイのご予約が確定しました",
                "[Temple Community] Your Templestay reservation is confirmed"));
        message.setText(
                pick(lang,
                        "예약이 확정되었습니다. 아래 내용을 확인해주세요.\n\n",
                        "ご予約が確定しました。以下の内容をご確認ください。\n\n",
                        "Your reservation is confirmed. Please check the details below.\n\n") +
                reservationDetailLines(lang, reservationId, programTitle, templeName, templeAddress, startDate, endDate,
                        participantCount, amount, paymentMethod, representativeName, representativePhone, latitude, longitude)
        );
        mailSender.send(message);
    }

    /** 계좌이체(무통장입금) 신청 접수 안내 메일 - sendReservationReceipt("확정")와 달리 아직
        사찰이 입금을 확인하기 전(예약대기) 상태라는 걸 명확히 알려준다. 확정되면 사찰이
        입금확인 처리할 때 PaymentService가 sendReservationReceipt로 별도 확정 메일을 보낸다. */
    public void sendReservationPendingNotice(String email, String lang, Long reservationId, String programTitle, String templeName,
                                               String templeAddress, LocalDate startDate, LocalDate endDate,
                                               int participantCount, int amount, String paymentMethod,
                                               String representativeName, String representativePhone,
                                               BigDecimal latitude, BigDecimal longitude) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(pick(lang,
                "[사찰 커뮤니티] 템플스테이 예약 신청이 접수되었습니다(입금확인 대기중)",
                "[寺院コミュニティ] テンプルステイのご予約申込を受け付けました(入金確認待ち)",
                "[Temple Community] Your Templestay reservation request was received (awaiting payment confirmation)"));
        message.setText(
                pick(lang,
                        "예약 신청이 접수되었습니다. 사찰에서 입금을 확인하면 예약이 확정되며, 확정되면 별도로 안내 메일을 보내드립니다.\n" +
                        "입금 확인은 신청일로부터 3일 안에 이루어지지 않으면 예약이 자동으로 취소되니 참고해주세요.\n\n",
                        "ご予約の申込を受け付けました。寺院が入金を確認するとご予約が確定し、確定後に別途ご案内メールをお送りします。\n" +
                        "お申込日から3日以内に入金確認が行われない場合、ご予約は自動的にキャンセルされますのでご注意ください。\n\n",
                        "Your reservation request has been received. It will be confirmed once the temple verifies your payment, and we will send a separate email when that happens.\n" +
                        "If the payment is not verified within 3 days of your request, the reservation will be canceled automatically.\n\n") +
                reservationDetailLines(lang, reservationId, programTitle, templeName, templeAddress, startDate, endDate,
                        participantCount, amount, paymentMethod, representativeName, representativePhone, latitude, longitude)
        );
        mailSender.send(message);
    }

    /** 예약 취소 안내 메일 - 본인 취소/사찰 관리자 취소/입금확인 기한 초과 자동취소 전부 여기로 보낸다. */
    public void sendReservationCanceledNotice(String email, String lang, Long reservationId, String programTitle,
                                                String templeName, LocalDate startDate, LocalDate endDate) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(pick(lang,
                "[사찰 커뮤니티] 템플스테이 예약이 취소되었습니다",
                "[寺院コミュニティ] テンプルステイのご予約がキャンセルされました",
                "[Temple Community] Your Templestay reservation has been canceled"));
        message.setText(
                pick(lang,
                        "아래 예약이 취소되었습니다.\n\n",
                        "以下のご予約がキャンセルされました。\n\n",
                        "The reservation below has been canceled.\n\n") +
                pick(lang, "예약번호: ", "予約番号: ", "Reservation No.: ") + reservationId + "\n" +
                pick(lang, "프로그램: ", "プログラム: ", "Program: ") + programTitle + "\n" +
                pick(lang, "사찰: ", "寺院: ", "Temple: ") + templeName + "\n" +
                pick(lang, "기간: ", "期間: ", "Period: ") + dateLine(lang, startDate, endDate) + "\n\n" +
                pick(lang,
                        "궁금한 점이 있으시면 마이페이지 > 1:1 문의를 이용해주세요.",
                        "ご不明な点がございましたら、マイページ > 1:1お問い合わせをご利用ください。",
                        "If you have any questions, please use My Page > 1:1 Inquiry.")
        );
        mailSender.send(message);
    }
}
