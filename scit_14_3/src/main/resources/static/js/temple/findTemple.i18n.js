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
        typeFilterLabel: "유형으로 찾기",
        typeSea: "바다",
        typeMountain: "산",
        typeRiver: "강",
        typeUrban: "도심",
        languageFilterLabel: "언어지원",
        supportEnglish: "영어 지원",
        favoriteFilterLabel: "즐겨찾기"
    },
    ja: {
        searchTypeName: "寺院検索",
        searchTypeAddress: "住所検索",
        searchPlaceholder: "検索語を入力してください",
        searchBtn: "検索",
        typeFilterLabel: "タイプで探す",
        typeSea: "海",
        typeMountain: "山",
        typeRiver: "川",
        typeUrban: "都心",
        languageFilterLabel: "言語対応",
        supportEnglish: "英語対応",
        favoriteFilterLabel: "お気に入り"
    },
    en: {
        searchTypeName: "Search by name",
        searchTypeAddress: "Search by address",
        searchPlaceholder: "Enter a search term",
        searchBtn: "Search",
        typeFilterLabel: "Find by type",
        typeSea: "Sea",
        typeMountain: "Mountain",
        typeRiver: "River",
        typeUrban: "Urban",
        languageFilterLabel: "Language support",
        supportEnglish: "English support",
        favoriteFilterLabel: "Favorites"
    }
};

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
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
        const key = el.getAttribute('data-i18n-placeholder');
        if(t[key] !== undefined) el.placeholder = t[key];
    });
}

onLanguageChange('ko');
