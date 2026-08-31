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

    /* common.js가 언어 버튼 클릭 시 호출하는 훅입니다. */
    function onLanguageChange(lang){
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if(!t) return; // 이 사전에 없는 언어면 그냥 무시

    document.querySelectorAll('[data-i18n]').forEach(function(el){
    const key = el.getAttribute('data-i18n');
    if(t[key] !== undefined) el.textContent = t[key];
});
}

    /* ===== 초기 상태 동기화 ===== */
    onLanguageChange('ko');