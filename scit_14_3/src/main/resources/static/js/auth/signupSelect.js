/* 이 페이지 자체 번역 사전(TRANSLATIONS + onLanguageChange) - html에 data-i18n 마커가
   하나도 안 붙어있어서 실제로는 한 번도 동작한 적이 없었음. 지금은 common.js의 기본
   번역기(defaultOnLanguageChange, 페이지 전체를 자동으로 번역함)가 대신 처리하고 있어서
   여기는 주석 처리해둠 - 필요하면 다시 살릴 수 있게 지우지 않고 남겨둠.

const TRANSLATIONS = {
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

let currentLang = 'ko';

// common.js가 언어 버튼 클릭 시 호출하는 훅입니다.
function onLanguageChange(lang){
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if(!t) return; // 이 사전에 없는 언어면 그냥 무시

    document.querySelectorAll('[data-i18n]').forEach(function(el){
        const key = el.getAttribute('data-i18n');
        if(t[key] !== undefined) el.textContent = t[key];
    });
}

// ===== 초기 상태 동기화 =====
onLanguageChange('ko');
*/
