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

   Chrome 138(2025-06)부터 정식(stable) 기능이라 플래그 없이 기본으로 동작함
   (그 이전 버전이면 'Translator' in self가 false라 조용히 defaultOnLanguageChange가
   끝남 - 다른 기능엔 영향 없음). 데스크톱 크롬/엣지 138+ 전용, 모바일/타 브라우저
   미지원. 최초 사용 시 번역 모델을 내려받느라 시간이 걸릴 수 있음(버튼에 반투명
   로딩 표시 + 전체화면 로딩 오버레이로 안내함).

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
// 번역 중 로딩 오버레이 문구 - 한국어 문장에 언어명만 끼워 넣으면 "日本語(으)로 번역하는 중..."처럼
// 어색하게 섞여서, 대상 언어 자체로 완전히 번역된 문장을 각각 준비해둔다.
const I18N_LOADING_MESSAGES = {
    ja: '日本語に翻訳中...',
    en: 'Translating to English...'
};
let i18nCurrentLang = 'ko';
const i18nTranslationCache = {}; // i18nTranslationCache[lang][원문] = 번역문
let i18nOriginalTextNodes = null; // [{node, text}] - 최초 1회만 스냅샷
let i18nOriginalPlaceholders = null; // [{el, text}] - placeholder 속성은 텍스트 노드가 아니라 별도 스냅샷
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

    // ── 지도 마커 인포윈도우(mapCommon.js) - 마커 클릭할 때마다 새로 생기는 문구라
    // MutationObserver가 새 텍스트로 잡아서 원래는 Translator API로 넘어가던 걸 고정함 ──
    '상세보기': { ja: '詳細を見る', en: 'View Details' },
    '가까이 보기': { ja: '近くで見る', en: 'Zoom In' },
    '회원가입': { ja: '会員登録', en: 'Sign Up' },
    '계정이 없으신가요?': { ja: 'アカウントをお持ちではありませんか？', en: "Don't have an account?" },
    '이미 계정이 있으신가요?': { ja: 'すでにアカウントをお持ちですか？', en: 'Already have an account?' },

    // ── 로그인 페이지(auth/login.html)의 카카오 콜백 안내 문구 - UserController가
    // flash attribute(loginNotice)로 넘기는 고정 문구라 th:text로 그려지므로,
    // data-i18n 대신 여기 사전(텍스트 매칭)으로 처리함 ──
    '이미 가입된 카카오 계정입니다. 로그인해주세요.': { ja: '既に登録済みのKakaoアカウントです。ログインしてください。', en: 'This Kakao account is already registered. Please log in.' },
    '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.': { ja: 'パスワードが再設定されました。新しいパスワードでログインしてください。', en: 'Your password has been reset. Please log in with your new password.' },

    // ── 프래그먼트: 로고 옆 메인 네비게이션 (fragments/common-includes.html) ──
    '템플스테이예약': { ja: 'テンプルステイ予約', en: 'Book a Templestay' },
    '사찰찾기': { ja: '寺院を探す', en: 'Find a Temple' },

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

    // ── 즐겨찾기 토글 버튼(favoriteButton.js) - 클릭할 때마다 이 파일이 라벨을 직접
    // 다시 쓰는데, 그때 항상 한국어로 박아 넣어서 번역해둔 언어가 원상복구되는 문제가
    // 있었음 - favoriteButton.js가 이 사전을 직접 참조하도록 고쳐서 해결함 ──
    '즐겨찾기됨': { ja: 'お気に入り済み', en: 'Favorited' },
    '즐겨찾기': { ja: 'お気に入り', en: 'Favorite' },

    // 탈퇴한 회원의 리뷰 작성자 자리에 서버(TempleStayReviewService.authorDisplayName)가 넣는
    // 고정 문구 - 닉네임과 달리 사용자 입력값이 아니라서 번역 대상(.no-translate를 안 붙임)
    '탈퇴한 회원': { ja: '退会した会員', en: 'Withdrawn member' },
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
    '공감을 눌러 둔 다른 사람의 후기입니다.': { ja: '「いいね」を押した他の人のレビューです。', en: "Other people's reviews you have liked." },

    // ── 마이페이지 허브 카드 배지의 숫자 단위 - 숫자는 no-translate로 번역 대상에서 빼고
    // 단위 글자만 여기서 고정 번역함. 숫자+단위를 한 덩어리로 번역기에 매번 새로 태우면
    // (예: "12건", "4개"처럼 값이 계속 바뀌니 캐시가 매번 새로 생김) 짧은 숫자+단위 조합을
    // 기계번역이 엉뚱하게 처리하는 경우가 있었음(예: "4개" -> "Three") - 단위만 떼어
    // 고정 사전으로 처리해서 항상 같은 결과가 나오게 함. ──
    // "좋아요"를 기계번역기에 그냥 태우면 일본어로 "良い"(형용사 "좋다")로 나와서 어색함 -
    // SNS에서 통용되는 "いいね"로 고정.
    '좋아요': { ja: 'いいね', en: 'Like' },
    '건': { ja: '件', en: ' items' },
    '곳': { ja: 'ヶ所', en: ' places' },
    '개': { ja: '個', en: ' items' }
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

/** input/textarea의 placeholder도 화면에 보이는 안내문이라 같이 번역 대상에 넣음 -
    속성이라 TreeWalker(SHOW_TEXT)로는 안 잡혀서 별도로 모음. */
function collectI18nPlaceholderElements(){
    return Array.from(document.body.querySelectorAll('[placeholder]')).filter(el => {
        return el.placeholder && el.placeholder.trim() && !isI18nExcluded(el);
    });
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

/** placeholder는 앞뒤 공백을 보존할 이유가 없어(입력칸 안내문일 뿐) 값을 그대로 치환함. */
function applyTranslatedPlaceholders(entries, lang){
    entries.forEach(({el, text}) => {
        const trimmed = text.trim();
        if(!trimmed) return;
        const translated = i18nTranslationCache[lang][trimmed];
        if(translated === undefined) return;
        el.placeholder = translated;
    });
}

/** 최초 스냅샷 이후에 새로 생긴 텍스트 노드/placeholder(달력 월 이동, 모달 등)를 찾아서 같은 방식으로 번역함. */
async function retranslateNewContent(lang){
    if(!i18nOriginalTextNodes || lang === I18N_SOURCE_LANG) return;
    const knownNodes = new Set(i18nOriginalTextNodes.map(o => o.node));
    const freshNodes = collectI18nTextNodes().filter(n => !knownNodes.has(n));

    const knownEls = new Set((i18nOriginalPlaceholders || []).map(o => o.el));
    const freshPlaceholderEls = collectI18nPlaceholderElements().filter(el => !knownEls.has(el));

    if(freshNodes.length === 0 && freshPlaceholderEls.length === 0) return;

    const textEntries = freshNodes.map(node => ({node, text: node.textContent}));
    const placeholderEntries = freshPlaceholderEls.map(el => ({el, text: el.placeholder}));
    i18nOriginalTextNodes.push(...textEntries);
    if(!i18nOriginalPlaceholders) i18nOriginalPlaceholders = [];
    i18nOriginalPlaceholders.push(...placeholderEntries);

    try {
        const uniqueTexts = Array.from(new Set([
            ...textEntries.map(o => o.text.trim()),
            ...placeholderEntries.map(o => o.text.trim())
        ].filter(Boolean)));
        await ensureTranslated(uniqueTexts, lang);
        applyTranslatedText(textEntries, lang);
        applyTranslatedPlaceholders(placeholderEntries, lang);
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

/** 지도 마커의 사찰명/주소는 번역기가 아니라 사전(templeI18n.js)으로 그림 - 번역기가 텍스트를 다 적용한
    뒤에 mapCommon.js의 갱신 함수를 불러서 그 값으로 다시 덮음(사찰찾기 페이지는 자기 훅에서 따로 부름). */
function refreshTempleMapText(lang){
    if(typeof window.refreshTempleMarkerLanguage === 'function') window.refreshTempleMarkerLanguage(lang);
    // 페이지가 자기 사전(예: programI18n.js)으로 덮어쓸 함수를 window.i18nAfterApplyHooks에 등록해두면 같이 실행
    (window.i18nAfterApplyHooks || []).forEach(function(fn){
        try { fn(lang); } catch(e){ console.warn('[common.js] 번역 후처리 훅 오류', e); }
    });
}

async function defaultOnLanguageChange(lang, btn){
    if(!i18nOriginalTextNodes){
        i18nOriginalTextNodes = collectI18nTextNodes().map(node => ({node, text: node.textContent}));
    }
    if(!i18nOriginalPlaceholders){
        i18nOriginalPlaceholders = collectI18nPlaceholderElements().map(el => ({el, text: el.placeholder}));
    }

    if(lang === I18N_SOURCE_LANG){
        i18nCurrentLang = lang;
        applyOriginalText();
        refreshTempleMapText(lang);
        return;
    }

    if(!('Translator' in self)){
        console.warn('[common.js] 이 브라우저는 Translator API를 지원하지 않습니다. Chrome/Edge 138 이상 데스크톱 버전으로 업데이트해보세요(모바일/타 브라우저는 미지원).');
        // 기계번역은 못 해도 사전으로 그리는 부분(지도 사찰명, 프로그램 지역/유형 등)은 적용 가능
        i18nCurrentLang = lang;
        refreshTempleMapText(lang);
        return;
    }

    // 최초 사용 시 번역 모델을 새로 내려받을 수 있어 시간이 걸림 - 버튼이 멈춘 것처럼
    // 보이지 않도록 로딩 표시만 해두고, 실제 완료까지는 계속 기다린다(강제 타임아웃으로
    // 끊으면 다운로드 중이던 것도 같이 날아가서 오히려 더 오래 걸리게 됨). 전체화면
    // 로딩 오버레이도 같이 띄워서 어떤 언어로 번역 중인지 보여준다.
    if(btn) btn.classList.add('i18n-loading');
    showLoading(I18N_LOADING_MESSAGES[lang] || '번역하는 중...');

    try {
        const uniqueTexts = Array.from(new Set([
            ...i18nOriginalTextNodes.map(o => o.text.trim()),
            ...i18nOriginalPlaceholders.map(o => o.text.trim())
        ].filter(Boolean)));
        await ensureTranslated(uniqueTexts, lang);
        i18nCurrentLang = lang;
        applyTranslatedText(i18nOriginalTextNodes, lang);
        applyTranslatedPlaceholders(i18nOriginalPlaceholders, lang);
        startI18nObserver();
        refreshTempleMapText(lang);
    } catch(e){
        console.warn('[common.js] 번역 중 오류가 발생했습니다.', e);
    } finally {
        if(btn) btn.classList.remove('i18n-loading');
        hideLoading();
    }
}

function applyOriginalText(){
    i18nMutating = true;
    try {
        i18nOriginalTextNodes.forEach(({node, text}) => { node.textContent = text; });
        if(i18nOriginalPlaceholders){
            i18nOriginalPlaceholders.forEach(({el, text}) => { el.placeholder = text; });
        }
    } finally {
        i18nMutating = false;
    }
}

// ===== 언어 선택 저장(쿠키) =====
// 페이지 이동/새로고침해도 방금 고른 언어가 유지되도록 쿠키에 저장해둔다. 1년 유지.
const I18N_LANG_COOKIE = 'preferredLang';

function getCookie(name){
    const match = document.cookie.match(new RegExp('(?:^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days){
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

document.querySelectorAll('.language-button').forEach(function(btn){
    btn.addEventListener('click', function(){
        const lang = btn.getAttribute('data-lang');

        document.querySelectorAll('.language-button').forEach(function(b){
            b.classList.toggle('active', b === btn);
        });

        setCookie(I18N_LANG_COOKIE, lang, 365);

        if(typeof onLanguageChange === 'function'){
            onLanguageChange(lang);
        } else {
            defaultOnLanguageChange(lang, btn);
        }
    });
});

// 페이지 로드 시 저장해둔 언어가 있으면(한국어가 아니면) 자동으로 그 언어를 다시 적용.
// home.js처럼 페이지가 자기만의 onLanguageChange(data-i18n 사전 방식)를 DOMContentLoaded
// 콜백 안에서 뒤늦게 정의하는 경우가 있다 - 이 코드가 그보다 먼저 실행되면 아직 함수가 없어서
// 크롬 내장 번역 경로(defaultOnLanguageChange)로 새버린다. DOMContentLoaded 리스너 등록
// 순서에 기대면 common.js가 defer인지, 스크립트 태그가 어디 있는지에 따라 뒤집힐 수 있어서
// 불안정함(실제로 한 번 이걸로 깨진 적 있음) - 대신 window의 load 이벤트를 쓴다. load는
// DOMContentLoaded의 모든 리스너가 실행을 마친 뒤에만 발생한다고 명세로 보장되므로,
// 페이지별 onLanguageChange가 언제 어떻게 정의되든 항상 그 이후에 실행됨이 보장된다.
window.addEventListener('load', function applySavedLanguage(){
    const saved = getCookie(I18N_LANG_COOKIE);
    if(!saved || saved === I18N_SOURCE_LANG) return;

    const targetBtn = document.querySelector('.language-button[data-lang="' + saved + '"]');
    if(!targetBtn) return;

    document.querySelectorAll('.language-button').forEach(function(b){
        b.classList.toggle('active', b === targetBtn);
    });

    if(typeof onLanguageChange === 'function'){
        onLanguageChange(saved);
    } else {
        defaultOnLanguageChange(saved, targetBtn);
    }
});

/* ===== 인증 드롭다운(auth-nav-fragment) 관련 코드는 여기 그대로 유지 =====
   (기존에 이미 작성해두신 openDropdown/closeDropdown 등은 이 파일에
   그대로 남겨두시면 됩니다 — 이번 수정과 무관합니다) */

/* ===== 전체화면 로딩 오버레이 =====
   서버(특히 원격 DB)에서 값 가져오는 동안 화면 전체를 반투명 회색으로 덮고
   진행률 바(%) + 메시지를 보여준다. 오래 걸리는 fetch 앞뒤로 showLoading()/hideLoading()만
   호출하면 됨 - 여러 군데서 동시에 불러도 카운터로 관리해서 먼저 끝난 쪽이 먼저 hideLoading()
   해도 다른 쪽이 아직 안 끝났으면 오버레이가 사라지지 않는다.

   %는 실제 다운로드 진행률이 아니라 흉내낸 값이다(fetch 응답이 압축되면 Content-Length를
   못 믿어서 정확한 진행률 계산이 불가능함) - 90%까지 점점 느려지며 차오르다가, 실제로
   끝나면(hideLoading) 100%를 잠깐 보여주고 닫힌다. */
let _loadingCount = 0;
let _loadingPercent = 0;
let _loadingTimer = null;

function _setLoadingBar(percent) {
    const label = document.getElementById('loading-bar-percent');
    if (label) label.textContent = Math.round(percent) + '%';
}

function showLoading(message) {
    _loadingCount++;
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML =
            '<div class="loading-spinner-wrap">' +
                '<div class="loading-spinner"></div>' +
                '<div class="loading-bar-percent" id="loading-bar-percent">0%</div>' +
            '</div>' +
            '<div class="loading-overlay-text">' + (message || '불러오는 중...') + '</div>';
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-overlay-text').textContent = message || '불러오는 중...';
        overlay.hidden = false;
    }

    _loadingPercent = 0;
    _setLoadingBar(0);
    clearInterval(_loadingTimer);
    _loadingTimer = setInterval(function () {
        _loadingPercent += (90 - _loadingPercent) * 0.05 + 0.3;
        if (_loadingPercent > 90) _loadingPercent = 90;
        _setLoadingBar(_loadingPercent);
    }, 100);
}

function hideLoading() {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount > 0) return;
    clearInterval(_loadingTimer);
    _setLoadingBar(100);
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        setTimeout(function () { overlay.hidden = true; }, 200);
    }
}

/* ===== 뒤로가기(bfcache 복원) 시 로딩 오버레이 강제 해제 =====
   링크 클릭/폼 제출 때 띄운 오버레이는 새 페이지가 뜨면 저절로 사라진다. 그런데 새 페이지로 갔다가
   뒤로가기를 누르면 브라우저가 이전 페이지를 다시 만들지 않고 떠나기 직전 화면 그대로(오버레이가
   켜진 채로) 통째로 복원하는 경우가 있다(bfcache). 이때는 스크립트가 다시 실행되지 않아서
   hideLoading()이 호출되지 않아 무한 로딩처럼 보였다. pageshow 이벤트의 persisted가 true면
   bfcache 복원이라는 뜻이므로 오버레이와 카운터를 초기화한다. */
window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    _loadingCount = 0;
    clearInterval(_loadingTimer);
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.hidden = true;
});

/* ===== 순수 form POST(페이지 전체 이동) 제출 시 로딩 표시 =====
   fetch가 아니라 그냥 <form method="post">라서 hideLoading()을 부를 시점이 없다(페이지가
   통째로 넘어가버림) - 그래도 showLoading()만 부르면 새 페이지가 뜨거나 브라우저가 그 위에
   렌더링할 때까지 오버레이가 남아있어서 문제없다(탈퇴 신청/철회, 회원정보 수정처럼 원격 DB
   왕복 + 리다이렉트가 겹쳐 느린 화면들이 대상 - Aiven처럼 원격 DB를 쓰면 로컬보다 왕복이 길어서
   버튼 누른 뒤 아무 반응 없이 멈춘 것처럼 보였음).

   버튼을 누르자마자 무조건 띄우면 그 폼에 달린 다른 제출 검증(예: 법명 중복확인 안 함, 약관
   미동의)이 나중에 preventDefault()로 막아도 오버레이가 뜬 채로 남는다 - setTimeout(0)으로
   한 틱 미뤄서, 같은 submit 이벤트의 다른 리스너들이 먼저 다 실행되고 난 뒤에
   e.defaultPrevented를 확인한다(등록 순서와 무관하게 항상 안전하게 동작).

   common.js는 commonIncludes 조각(각 페이지 body 맨 위)에서 defer 없이 바로 실행되므로,
   그 아래에 있는 페이지 자신의 <form>은 이 시점엔 아직 파싱되지 않은 상태다 - DOMContentLoaded까지
   기다렸다가 찾는다. */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form.page-form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            setTimeout(function () {
                if (!e.defaultPrevented) {
                    showLoading('처리 중...');
                }
            }, 0);
        });
    });
});

/* ===== 일반 <a> 링크 클릭(페이지 이동) 시 로딩 표시 =====
   위 form.page-form과 똑같은 문제 - 사찰 프로그램 관리 "상세보기"처럼 그냥 <a href="...">
   링크 하나로 원격 DB(Aiven) 조회가 여러 건 걸리는 페이지로 이동하면, 페이지 그려질 때까지
   아무 반응 없이 멈춘 것처럼 보였다. 일일이 페이지마다 찾아 고치는 대신 클릭 이벤트를
   document 레벨에서 한 번에 잡아서 전체 사이트 링크에 공통 적용한다.

   지도 인포윈도우의 "가까이 보기"(href="#")나 드롭다운 토글처럼 자기 JS가 preventDefault()로
   실제 이동을 막는 링크까지 오버레이가 뜨면 안 되므로, submit과 동일하게 setTimeout(0)으로
   한 틱 미뤄서 다른 클릭 리스너가 먼저 다 실행된 뒤 e.defaultPrevented를 확인한다. 새 탭으로
   여는 경우(target, ctrl/cmd/휠클릭)와 페이지 이동이 아닌 링크(#, javascript:, mailto:, tel:,
   download)는 애초에 현재 페이지가 안 넘어가므로 제외한다. */
document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;
    if (link.target && link.target !== '_self') return; // 새 탭으로 열리는 링크는 현재 페이지 안 떠남
    if (link.hasAttribute('download')) return;

    const href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#'
        || href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
        return;
    }

    setTimeout(function () {
        if (!e.defaultPrevented) {
            showLoading('불러오는 중...');
        }
    }, 0);
});
