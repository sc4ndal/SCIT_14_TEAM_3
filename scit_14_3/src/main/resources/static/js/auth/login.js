/* ============================================================
   login.js — 로그인 페이지 전용 (사전 방식 다국어 처리)
   signup.js와 같은 방식: 크롬 실험적 Translator API(defaultOnLanguageChange)에
   기대지 않고, 이 페이지에 나오는 문구를 직접 사전으로 들고 있다가
   언어 버튼 클릭 시 그대로 치환함 - 그래야 API 미지원 환경에서도 확실히 동작함.
============================================================ */

const TRANSLATIONS = {
    ko: {
        subtitle: "아이디와 비밀번호를 입력해주세요",
        errorMsg: "아이디 또는 비밀번호가 올바르지 않습니다.",
        kakaoLoginBtn: "카카오로 3초만에 로그인",
        dividerText: "또는 아이디로 로그인",
        idLabel: "아이디",
        pwLabel: "비밀번호",
        cancelBtn: "취소",
        findIdLink: "아이디 찾기",
        findPwLink: "비밀번호 찾기",
        rememberIdLabel: "아이디 기억하기"
    },
    ja: {
        subtitle: "IDとパスワードを入力してください",
        errorMsg: "IDまたはパスワードが正しくありません。",
        kakaoLoginBtn: "Kakaoで3秒ログイン",
        dividerText: "またはIDでログイン",
        idLabel: "ID",
        pwLabel: "パスワード",
        cancelBtn: "キャンセル",
        findIdLink: "IDを探す",
        findPwLink: "パスワードを探す",
        rememberIdLabel: "IDを記憶する"
    },
    en: {
        subtitle: "Please enter your ID and password",
        errorMsg: "Incorrect ID or password.",
        kakaoLoginBtn: "Log in with Kakao in 3 seconds",
        dividerText: "Or log in with your ID",
        idLabel: "ID",
        pwLabel: "Password",
        cancelBtn: "Cancel",
        findIdLink: "Find ID",
        findPwLink: "Find Password",
        rememberIdLabel: "Remember my ID"
    }
};

/* 아이디 기억하기: 서버 세션이 아니라 이 브라우저에만 저장되는 로컬 편의 기능 -
   체크 시 localStorage에 아이디를 저장해뒀다가 다음 방문 때 자동으로 채워줌. */
const REMEMBER_ID_KEY = "rememberedLoginId";

function initRememberId(){
    const idInput = document.getElementById("username");
    const rememberCheckbox = document.getElementById("rememberId");
    if(!idInput || !rememberCheckbox) return;

    let savedId = "";
    try {
        savedId = localStorage.getItem(REMEMBER_ID_KEY) || "";
    } catch (e) {
        // 시크릿 모드 등 localStorage 접근이 막힌 환경 - 그냥 기능 없이 넘어감
    }

    if (savedId) {
        idInput.value = savedId;
        rememberCheckbox.checked = true;
    }

    idInput.closest("form").addEventListener("submit", function(){
        try {
            if (rememberCheckbox.checked) {
                localStorage.setItem(REMEMBER_ID_KEY, idInput.value);
            } else {
                localStorage.removeItem(REMEMBER_ID_KEY);
            }
        } catch (e) {
            // 저장 실패해도 로그인 자체는 그대로 진행
        }
    });
}

/* common.js가 언어 버튼 클릭 시 호출하는 훅. active 클래스 토글은 common.js가 처리함. */
function onLanguageChange(lang){
    const t = TRANSLATIONS[lang];
    if(!t) return;

    // 프래그먼트(로그인/회원가입 링크, 드롭다운 등)는 이 페이지 전용 사전이 아니라
    // common.js의 공용 사전(I18N_MANUAL_OVERRIDES)에 있음 - 같이 적용해줌.
    if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(lang);

    document.querySelectorAll('[data-i18n]').forEach(function(el){
        const key = el.getAttribute('data-i18n');
        if(t[key] !== undefined) el.textContent = t[key];
    });
}

onLanguageChange('ko');
initRememberId();
