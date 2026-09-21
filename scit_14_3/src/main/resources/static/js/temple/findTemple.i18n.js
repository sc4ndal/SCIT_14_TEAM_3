/* ============================================================
   findTemple.i18n.js — 사찰 찾아보기(지도) 페이지 전용 사전 번역
   login.js/signup.js와 같은 방식: 크롬 실험적 Translator API에 기대지 않고
   이 페이지에 나오는 문구를 직접 사전으로 들고 있다가 언어 버튼 클릭 시 바로 치환함.
============================================================ */

const TRANSLATIONS = {
    ko: {
        searchTypeName: "사찰 검색",
        searchTypeAddress: "주소 검색",
        searchPlaceholder: "검색어를 입력하세요",
        searchBtn: "검색",
        typeFilterLabel: "유형",
        typeSea: "바다",
        typeMountain: "산",
        typeRiver: "강",
        typeUrban: "도심",
        languageFilterLabel: "언어지원",
        supportEnglish: "영어 지원",
        favoriteFilterLabel: "즐겨찾기",
        resetMapBtn: "지도 전체보기",
        resultPanelTitle: "사찰 목록",
        nearMeAria: "내 주변 사찰"
    },
    ja: {
        searchTypeName: "寺院検索",
        searchTypeAddress: "住所検索",
        searchPlaceholder: "検索語を入力してください",
        searchBtn: "検索",
        typeFilterLabel: "タイプ",
        typeSea: "海",
        typeMountain: "山",
        typeRiver: "川",
        typeUrban: "都心",
        languageFilterLabel: "言語対応",
        supportEnglish: "英語対応",
        favoriteFilterLabel: "お気に入り",
        resetMapBtn: "地図全体を見る",
        resultPanelTitle: "寺院一覧",
        nearMeAria: "現在地周辺の寺院"
    },
    en: {
        searchTypeName: "Search by name",
        searchTypeAddress: "Search by address",
        searchPlaceholder: "Enter a search term",
        searchBtn: "Search",
        typeFilterLabel: "Type",
        typeSea: "Sea",
        typeMountain: "Mountain",
        typeRiver: "River",
        typeUrban: "Urban",
        languageFilterLabel: "Language Support",
        supportEnglish: "English Support",
        favoriteFilterLabel: "Favorites",
        resetMapBtn: "View Full Map",
        resultPanelTitle: "Temple List",
        nearMeAria: "Temples near me"
    }
};

/* common.js가 언어 버튼 클릭 시 호출하는 훅. active 클래스 토글은 common.js가 처리함. */
function onLanguageChange(lang){
    const t = TRANSLATIONS[lang];
    if(!t) return;

    // 이 페이지 사전(data-i18n / data-i18n-placeholder)으로 그리는 요소는 아래에서 켜는
    // MutationObserver(common.js)가 "새로 생긴 한국어"로 오해해서 크롬 번역기로 다시 덮어쓰지
    // 않도록 .no-translate로 보호함(안 하면 "강"이 こんにちは로, "Language support"가 대소문자가
    // 뒤섞여 바뀜). 공용 사전 처리(applyManualOverrideTranslations)보다 먼저 붙여야 스냅샷에서도 빠짐.
    document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach(function(el){
        el.classList.add('no-translate');
    });

    // 프래그먼트(로그인/회원가입 링크, 드롭다운 등)는 이 페이지 전용 사전이 아니라
    // common.js의 공용 사전(I18N_MANUAL_OVERRIDES)에 있음 - 같이 적용해줌.
    if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(lang);

    // 이 페이지는 defaultOnLanguageChange(common.js)를 안 타서 그 안에서만 켜지는
    // MutationObserver(새로 생기는 텍스트 감시)가 원래 안 돎 - 그래서 지도 마커를
    // 클릭할 때마다 새로 생기는 인포윈도우 문구("상세보기"/"가까이 보기" 등)가
    // 언어를 바꿔도 그대로 한국어로 남아있었다. i18nCurrentLang/startI18nObserver는
    // common.js와 같은 전역 스코프(같은 페이지의 다른 <script> 태그)라 여기서도
    // 바로 쓸 수 있다 - 직접 켜서 그 문제를 없앤다.
    if (typeof i18nCurrentLang !== 'undefined') i18nCurrentLang = lang;
    if (typeof startI18nObserver === 'function') startI18nObserver();

    document.querySelectorAll('[data-i18n]').forEach(function(el){
        const key = el.getAttribute('data-i18n');
        if(t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
        const key = el.getAttribute('data-i18n-placeholder');
        if(t[key] !== undefined) el.placeholder = t[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
        const key = el.getAttribute('data-i18n-aria');
        if(t[key] !== undefined) el.setAttribute('aria-label', t[key]);
    });

    // 사찰명/주소 사전 번역(templeI18n.js) - 이미 그려진 마커 이름표/정보창 + 검색 결과 목록을
    // 지금 언어로 다시 그림. templeList.js(kakao.maps.load 콜백)가 아직 안 끝났으면
    // (최초 onLanguageChange('ko') 호출 시점) 함수가 아직 없을 수 있어 존재 여부만 확인.
    if (typeof window.refreshTempleMapLanguage === 'function') window.refreshTempleMapLanguage(lang);
}

onLanguageChange('ko');
