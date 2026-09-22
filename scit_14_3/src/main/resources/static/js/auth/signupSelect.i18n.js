/* signupSelect.html(회원가입 방식 선택 화면) 전용 번역 사전.
   common.js가 언어 버튼 클릭 시 window.onLanguageChange만 정의되어 있으면
   그걸 우선 호출해줌(기본 경로인 Chrome Translator API 대신) - 문구가 몇 줄 안 돼서
   직접 사전으로 관리함. */

const SIGNUP_SELECT_TRANSLATIONS = {
    ko: {
        title: "회원가입",
        subtitle: "원하시는 방법으로 가입을 진행해주세요",
        emailBtn: "이메일로 가입하기",
        kakaoBtn: "카카오로 가입하기",
        footerNoteText: "이미 계정이 있으신가요?",
        footerNoteLoginLink: "로그인"
    },
    ja: {
        title: "会員登録",
        subtitle: "ご希望の方法で登録を進めてください",
        emailBtn: "メールで登録する",
        kakaoBtn: "Kakaoで登録する",
        footerNoteText: "すでにアカウントをお持ちですか？",
        footerNoteLoginLink: "ログイン"
    },
    en: {
        title: "Sign Up",
        subtitle: "Please choose how you'd like to sign up",
        emailBtn: "Sign up with email",
        kakaoBtn: "Sign up with Kakao",
        footerNoteText: "Already have an account?",
        footerNoteLoginLink: "Log in"
    }
};

let currentLang = "ko";

window.onLanguageChange = function (lang) {
    currentLang = SIGNUP_SELECT_TRANSLATIONS[lang] ? lang : "ko";

    // 헤더/로그인/드롭다운 등 공통 프래그먼트는 이 페이지 전용 사전이 아니라
    // common.js의 공용 사전(I18N_MANUAL_OVERRIDES)에 있음 - 같이 적용해줌.
    if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(currentLang);

    const t = SIGNUP_SELECT_TRANSLATIONS[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key] !== undefined) el.textContent = t[key];
    });
};

onLanguageChange("ko");
