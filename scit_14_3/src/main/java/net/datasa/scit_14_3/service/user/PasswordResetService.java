package net.datasa.scit_14_3.service.user;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 비밀번호 재설정 토큰 발급/검증.
 * 배포용 사이트가 아니라서 DB 테이블 없이 메모리(ConcurrentHashMap)에만 둔다 -
 * 서버 재시작하면 발급된 토큰은 전부 날아가지만(=재요청하면 그만), 스키마 변경 없이 간단하게 끝낼 수 있음.
 * 이메일 인증(EmailVerificationService)이 세션에 두는 것과 달리, 재설정 링크는 메일을 연
 * 브라우저(요청한 세션과 다를 수 있음)에서 열리므로 세션이 아니라 서버 전역 저장소여야 함.
 */
@Service
public class PasswordResetService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(5);

    private record ResetEntry(String loginId, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, ResetEntry> tokenStore = new ConcurrentHashMap<>();

    public String createToken(String loginId) {
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new ResetEntry(loginId, Instant.now().plus(TOKEN_TTL)));
        return token;
    }

    /** 링크를 눌러 재설정 화면에 들어올 때, 그리고 실제 비밀번호 변경 직전에 다시 한번 확인하는 용도. */
    public Optional<String> resolveLoginId(String token) {
        ResetEntry entry = tokenStore.get(token);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            tokenStore.remove(token);
            return Optional.empty();
        }
        return Optional.of(entry.loginId());
    }

    /** 비밀번호 변경 성공 직후 호출 - 1회용이라 성공하자마자 폐기해서 링크 재사용을 막음. */
    public void invalidate(String token) {
        tokenStore.remove(token);
    }
}
