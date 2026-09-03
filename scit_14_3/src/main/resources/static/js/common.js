/* ============================================================
   common.js — 모든 페이지가 공유하는 fragment 스크립트
   ------------------------------------------------------------
   언어 버튼(.language-button) 클릭을 감지해서:
     1) 어떤 버튼이 선택됐는지 active 표시를 이 파일이 직접 처리
     2) 페이지가 자기만의 onLanguageChange(lang)을 정의해뒀으면
        그걸 우선 사용 (signup.js처럼 유효성 검사 메시지 등 페이지
        로드 후 JS가 새로 그려 넣는 동적 문구가 많아서 사전(TRANSLATIONS)
        방식이 필요한 경우), 없으면 defaultOnLanguageChange(lang)이 크롬 내장
        Translator API로 페이지 전체 텍스트를 그 자리에서 번역함 -
        대부분의 페이지는 아무것도 안 해도 자동으로 다국어가 됨.

   ⚠️ 크롬 실험 기능이라 아래 플래그를 켜야 동작함(끄면 조용히
   아무 일도 안 일어남 - 다른 기능엔 영향 없음):
     chrome://flags/#translation-api
     chrome://flags/#language-detection-api
     chrome://flags/#optimization-guide-on-device-model
   전부 Enabled로 바꾸고 크롬 재시작. 데스크톱 크롬 전용, 모바일/
   타 브라우저 미지원. 최초 사용 시 번역 모델을 내려받느라 시간이
   걸릴 수 있음(버튼에 반투명 로딩 표시로 안내함).

   defaultOnLanguageChange 동작 원리:
   document.body 안의 모든 텍스트 노드를 TreeWalker로 순회해서
   원문을 한 번 스냅샷해두고(i18nOriginalTextNodes), 언어가 바뀌면
   Translator API로 번역 받아 각 텍스트 노드에 그대로 꽂아 넣음.
   요소마다 data-i18n을 일일이 붙일 필요 없음. 번역 결과는 언어별로
   캐시해서 재사용함.

   달력 월 이동처럼 페이지가 자바스크립트로 나중에 새 텍스트를 그려
   넣는 부분은 최초 스냅샷엔 없어서 그대로 두면 번역이 안 됨 -
   MutationObserver로 새로 생기는 텍스트를 계속 감시해서 같은 방식으로
   추가 번역함(startI18nObserver). 우리가 번역 결과를 넣느라 발생시키는
   변경은 i18nMutating 플래그로 구분해서 무한루프를 막음.
   ============================================================ */

const I18N_SOURCE_LANG = 'ko';
let i18nCurrentLang = 'ko';
const i18nTranslationCache = {}; // i18nTranslationCache[lang][원문] = 번역문
let i18nOriginalTextNodes = null; // [{node, text}] - 최초 1회만 스냅샷
let i18nMutating = false; // 번역 결과를 우리가 쓰는 중인지(옵저버가 자기 자신을 보고 재귀하지 않도록)
let i18nObserver = null;
let i18nRetranslateTimer = null;

// 기계번역이 부자연스럽거나 틀리게 나오는 문구는 여기 직접 지정함 - 있으면
// Translator API를 아예 안 부르고 이 값을 그대로 씀(예: "로그인"이 일본어로
// 번역기 태우면 "サインアップします"처럼 엉뚱하게 나옴 -> "ログイン"으로 고정).
// 프래그먼트(common-includes.html)의 드롭다운/로그아웃 메뉴처럼 고정된 문구도
// 매번 API 호출할 필요 없이 여기 사전으로 바로 처리함.
const I18N_MANUAL_OVERRIDES = {
    '로그인': { ja: 'ログイン', en: 'Log In' },
    '회원가입': { ja: '会員登録', en: 'Sign Up' },
    '계정이 없으신가요?': { ja: 'アカウントをお持ちではありませんか？', en: "Don't have an account?" },
    '이미 계정이 있으신가요?': { ja: 'すでにアカウントをお持ちですか？', en: 'Already have an account?' },

    // ── 로그인 페이지(auth/login.html)의 카카오 콜백 안내 문구 - UserController가
    // flash attribute(loginNotice)로 넘기는 고정 문구라 th:text로 그려지므로,
    // data-i18n 대신 여기 사전(텍스트 매칭)으로 처리함 ──
    '이미 가입된 카카오 계정입니다. 로그인해주세요.': { ja: '既に登録済みのKakaoアカウントです。ログインしてください。', en: 'This Kakao account is already registered. Please log in.' },
    '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.': { ja: 'パスワードが再設定されました。新しいパスワードでログインしてください。', en: 'Your password has been reset. Please log in with your new password.' },

    // ── 프래그먼트: 회원 드롭다운/로그아웃 (fragments/common-includes.html) ──
    '마이페이지': { ja: 'マイページ', en: 'My Page' },
    '회원정보수정': { ja: '会員情報修正', en: 'Edit Profile' },
    '예약목록': { ja: '予約一覧', en: 'My Reservations' },
    '내가 쓴 리뷰': { ja: '投稿したレビュー', en: 'My Reviews' },
    '관심 사찰': { ja: 'お気に入りの寺院', en: 'Favorite Temples' },
    '관심 행사': { ja: 'お気に入りの行事', en: 'Favorite Events' },
    '저장한 불교 한마디': { ja: '保存した仏教の一言', en: 'Saved Buddhist Quotes' },
    '관심 사찰음식': { ja: 'お気に入りの寺院料理', en: 'Favorite Temple Food' },
    '좋아요한 리뷰': { ja: 'いいねしたレビュー', en: 'Liked Reviews' },
    '사찰정보수정': { ja: '寺院情報修正', en: 'Edit Temple Info' },
    '사찰 프로그램 등록': { ja: '寺院プログラム登録', en: 'Register Program' },
    '사찰 프로그램 관리': { ja: '寺院プログラム管理', en: 'Manage Programs' },
    '관리': { ja: '管理', en: 'Manage' },
    '사찰 등록 요청 목록': { ja: '寺院登録リクエスト一覧', en: 'Temple Registration Requests' },
    '로그아웃': { ja: 'ログアウト', en: 'Log Out' },

    // ── 마이페이지 허브 (templates/mypage/mypage.html) ──
    '님, 오늘도 평안하시길': { ja: '様、今日も安らかな一日を', en: ", have a peaceful day" },
    '내가 저장하고 남긴 것들을 한자리에서 돌아봅니다.': { ja: '保存したり残したりしたものを一か所で振り返ります。', en: 'Review everything you have saved and left behind in one place.' },
    '바로가기 →': { ja: 'すぐ行く →', en: 'Go →' },
    '법명과 연락처 등 내 정보를 확인하고 수정합니다.': { ja: '法名や連絡先など、自分の情報を確認・修正します。', en: 'Check and edit your info, such as your name and contact details.' },
    '신청한 템플스테이 예약 내역을 확인합니다.': { ja: '申し込んだテンプルステイの予約履歴を確認します。', en: 'Check your Templestay reservation history.' },
    '사찰과 프로그램에 남긴 후기를 모아봅니다.': { ja: '寺院やプログラムに残したレビューをまとめて見ます。', en: 'See all the reviews you left for temples and programs.' },
    '저장해 둔 사찰을 다시 찾아봅니다.': { ja: '保存しておいた寺院を再び探します。', en: 'Revisit the temples you have saved.' },
    '관심 등록한 행사와 법회 일정입니다.': { ja: 'お気に入り登録した行事・法会の日程です。', en: 'Events and services you have favorited.' },
    '마음에 담아둔 불교 한마디 모음입니다.': { ja: '心に留めておいた仏教の一言集です。', en: 'A collection of Buddhist quotes you have kept close.' },
    '저장한 사찰음식을 한눈에 모아봅니다.': { ja: '保存した寺院料理を一目でまとめて見ます。', en: 'All the temple food you have saved, at a glance.' },
    '공감을 눌러 둔 다른 사람의 후기입니다.': { ja: '「いいね」を押した他の人のレビューです。', en: "Other people's reviews you have liked." }
};

// 번역하면 안 되는 영역(브랜드 로고, 언어 버튼 자기 자신, 사용자가 직접 입력한 값,
// card-kanji/background-kanji 같은 장식용 한자 - aria-hidden="true"라 스크린리더도 안 읽음).
// 닉네임/이름처럼 사용자가 입력한 고유값을 보여주는 요소에는 .no-translate 클래스를 붙이면 됨.
function isI18nExcluded(el){
    return !!el.closest('.brand, .language-area, .userEntity-nickname, .no-translate, [aria-hidden="true"], script, style, noscript');
}

function collectI18nTextNodes(){
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
            if(!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
            if(!node.parentElement || isI18nExcluded(node.parentElement)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const nodes = [];
    let n;
    while((n = walker.nextNode())) nodes.push(n);
    return nodes;
}

/** uniqueTexts 중 아직 캐시에 없는 것만 Translator API로 번역해서 lang의 캐시에 채워 넣음.
    (수동 지정 문구는 API를 아예 안 부르고 바로 채움) */
async function ensureTranslated(uniqueTexts, lang){
    const cache = i18nTranslationCache[lang] || (i18nTranslationCache[lang] = {});
    const toTranslate = uniqueTexts.filter(t => {
        if(cache[t] !== undefined) return false;
        const override = I18N_MANUAL_OVERRIDES[t] && I18N_MANUAL_OVERRIDES[t][lang];
        if(override){ cache[t] = override; return false; }
        return true;
    });
    if(toTranslate.length === 0) return;

    const availability = await Translator.availability({ sourceLanguage: I18N_SOURCE_LANG, targetLanguage: lang });
    if(availability === 'unavailable'){
        console.warn('[common.js] ' + lang + ' 번역을 지원하지 않습니다.');
        return;
    }
    const translator = await Translator.create({
        sourceLanguage: I18N_SOURCE_LANG,
        targetLanguage: lang,
        monitor(m){
            m.addEventListener('downloadprogress', e => {
                console.info('[common.js] 번역 모델 다운로드 중... ' + Math.round(e.loaded * 100) + '%');
            });
        }
    });
    const translatedList = await Promise.all(toTranslate.map(t => translator.translate(t)));
    toTranslate.forEach((t, i) => { cache[t] = translatedList[i]; });
}

/** I18N_MANUAL_OVERRIDES에 있는 문구만 사전 그대로 적용함(Translator API는 호출 안 함).
    home.js처럼 페이지가 자기만의 onLanguageChange(data-i18n 사전 방식)를 쓰느라
    defaultOnLanguageChange를 안 타는 경우에도, 프래그먼트(로그인/회원가입/드롭다운/로그아웃)
    같은 공용 고정 문구는 그 안에서 이 함수를 같이 불러서 번역되게 함. */
function applyManualOverrideTranslations(lang){
    if(!i18nOriginalTextNodes){
        i18nOriginalTextNodes = collectI18nTextNodes().map(node => ({node, text: node.textContent}));
    }
    i18nMutating = true;
    try {
        i18nOriginalTextNodes.forEach(({node, text}) => {
            if(lang === I18N_SOURCE_LANG){
                node.textContent = text;
                return;
            }
            const trimmed = text.trim();
            if(!trimmed) return;
            const override = I18N_MANUAL_OVERRIDES[trimmed] && I18N_MANUAL_OVERRIDES[trimmed][lang];
            if(override === undefined) return;
            const leading = text.match(/^\s*/)[0];
            const trailing = text.match(/\s*$/)[0];
            node.textContent = leading + override + trailing;
        });
    } finally {
        i18nMutating = false;
    }
}
window.applyManualOverrideTranslations = applyManualOverrideTranslations;

function applyTranslatedText(entries, lang){
    i18nMutating = true;
    try {
        entries.forEach(({node, text}) => {
            const trimmed = text.trim();
            if(!trimmed) return;
            const translated = i18nTranslationCache[lang][trimmed];
            if(translated === undefined) return;
            // 원문의 앞뒤 공백/줄바꿈은 레이아웃에 영향 주니 그대로 보존
            const leading = text.match(/^\s*/)[0];
            const trailing = text.match(/\s*$/)[0];
            node.textContent = leading + translated + trailing;
        });
    } finally {
        i18nMutating = false;
    }
}

/** 최초 스냅샷 이후에 새로 생긴 텍스트 노드(달력 월 이동 등)를 찾아서 같은 방식으로 번역함. */
async function retranslateNewContent(lang){
    if(!i18nOriginalTextNodes || lang === I18N_SOURCE_LANG) return;
    const known = new Set(i18nOriginalTextNodes.map(o => o.node));
    const freshNodes = collectI18nTextNodes().filter(n => !known.has(n));
    if(freshNodes.length === 0) return;

    const entries = freshNodes.map(node => ({node, text: node.textContent}));
    i18nOriginalTextNodes.push(...entries);

    try {
        const uniqueTexts = Array.from(new Set(entries.map(o => o.text.trim()).filter(Boolean)));
        await ensureTranslated(uniqueTexts, lang);
        applyTranslatedText(entries, lang);
    } catch(e){
        console.warn('[common.js] 새로 생긴 텍스트 번역 중 오류가 발생했습니다.', e);
    }
}

function startI18nObserver(){
    if(i18nObserver) return;
    i18nObserver = new MutationObserver(function(){
        if(i18nMutating || i18nCurrentLang === I18N_SOURCE_LANG) return;
        // 달력 다시 그리기처럼 짧은 시간에 변경이 우르르 몰리는 걸 한 번으로 묶어서 처리
        clearTimeout(i18nRetranslateTimer);
        i18nRetranslateTimer = setTimeout(function(){ retranslateNewContent(i18nCurrentLang); }, 150);
    });
    i18nObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
}

async function defaultOnLanguageChange(lang, btn){
    if(!i18nOriginalTextNodes){
        i18nOriginalTextNodes = collectI18nTextNodes().map(node => ({node, text: node.textContent}));
    }

    if(lang === I18N_SOURCE_LANG){
        i18nCurrentLang = lang;
        applyOriginalText();
        return;
    }

    if(!('Translator' in self)){
        console.warn('[common.js] 이 브라우저는 Translator API를 지원하지 않습니다. chrome://flags에서 translation-api / language-detection-api / optimization-guide-on-device-model 를 켜고 재시작해보세요(데스크톱 크롬 전용).');
        return;
    }

    // 최초 사용 시 번역 모델을 새로 내려받을 수 있어 시간이 걸림 - 버튼이 멈춘 것처럼
    // 보이지 않도록 로딩 표시만 해두고, 실제 완료까지는 계속 기다림(강제 타임아웃으로
    // 끊으면 다운로드 중이던 것도 같이 날아가서 오히려 더 오래 걸리게 됨).
    if(btn) btn.classList.add('i18n-loading');

    try {
        const uniqueTexts = Array.from(new Set(i18nOriginalTextNodes.map(o => o.text.trim()).filter(Boolean)));
        await ensureTranslated(uniqueTexts, lang);
        i18nCurrentLang = lang;
        applyTranslatedText(i18nOriginalTextNodes, lang);
        startI18nObserver();
    } catch(e){
        console.warn('[common.js] 번역 중 오류가 발생했습니다.', e);
    } finally {
        if(btn) btn.classList.remove('i18n-loading');
    }
}

function applyOriginalText(){
    i18nMutating = true;
    try {
        i18nOriginalTextNodes.forEach(({node, text}) => { node.textContent = text; });
    } finally {
        i18nMutating = false;
    }
}

document.querySelectorAll('.language-button').forEach(function(btn){
    btn.addEventListener('click', function(){
        const lang = btn.getAttribute('data-lang');

        document.querySelectorAll('.language-button').forEach(function(b){
            b.classList.toggle('active', b === btn);
        });

        if(typeof onLanguageChange === 'function'){
            onLanguageChange(lang);
        } else {
            defaultOnLanguageChange(lang, btn);
        }
    });
});

/* ===== 인증 드롭다운(auth-nav-fragment) 관련 코드는 여기 그대로 유지 =====
   (기존에 이미 작성해두신 openDropdown/closeDropdown 등은 이 파일에
   그대로 남겨두시면 됩니다 — 이번 수정과 무관합니다) */
