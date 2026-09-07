package net.datasa.scit_14_3.util;

import java.util.regex.Pattern;

/**
 * 비밀번호 강도 규칙 - 영문 대/소문자·숫자·특수문자(!@#$%^&*()) 모두 포함, 8~20자.
 *
 * <p>회원가입({@code LocalSignupRequestDto}의 {@code @Pattern}), 비밀번호 재설정
 * ({@code UserController}), 마이페이지 비밀번호 변경({@code MypageController})이 전부
 * 이 규칙 하나를 공유한다 - 예전엔 각자 정규식을 따로 들고 있어서 정책이 바뀌면 여러 곳을
 * 같이 고쳐야 했다.
 *
 * <p>{@link #REGEX}는 Bean Validation의 {@code @Pattern(regexp = ...)}가 컴파일타임 상수만
 * 받을 수 있어서 문자열로도 따로 노출해둔 것 - {@link #PATTERN}과 항상 같은 값이다.
 */
public final class PasswordPolicy {

    public static final String REGEX =
            "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()])[A-Za-z\\d!@#$%^&*()]{8,20}$";

    public static final Pattern PATTERN = Pattern.compile(REGEX);

    public static final String INVALID_MESSAGE =
            "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함하여 8~20자로 입력해주세요.";

    private PasswordPolicy() {
    }

    public static boolean isValid(String rawPassword) {
        return rawPassword != null && PATTERN.matcher(rawPassword).matches();
    }
}
