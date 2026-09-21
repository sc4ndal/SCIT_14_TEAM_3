/* ============================================================
   programI18n.js - 프로그램 목록(reservation.html) / 프로그램 상세(programDetail.html) 사전 번역
   ------------------------------------------------------------
   이 두 페이지는 언어 함수(onLanguageChange)가 따로 없어 common.js의 기본 번역 경로(크롬 번역기)를
   타는데, 지역명/프로그램 유형처럼 정해진 값은 기계번역이 어색해서 여기 사전으로 직접 번역한다.
   서버 값(value, 필터 비교)은 항상 한국어 원문을 쓰고, 화면에 보이는 글자만 바꾼다.

   사전에 없는 값(새 지역 등)은 원문(한글)을 그대로 돌려줘서 안 깨진다 - 그 부분만 기계번역이 처리.
   사찰명은 사찰찾기와 같은 사전(templeI18n.js)을 그대로 재사용한다.
============================================================ */

const PROGRAM_I18N = {
    // TEMPLE.region 실제 저장값(짧은 표기) + 아직 사찰이 없는 대전/울산
    region: {
        '강원': { ja: '江原道', en: 'Gangwon' },
        '경기': { ja: '京畿道', en: 'Gyeonggi' },
        '경남': { ja: '慶尚南道', en: 'South Gyeongsang' },
        '경북': { ja: '慶尚北道', en: 'North Gyeongsang' },
        '광주': { ja: '光州', en: 'Gwangju' },
        '대구': { ja: '大邱', en: 'Daegu' },
        '대전': { ja: '大田', en: 'Daejeon' },
        '부산': { ja: '釜山', en: 'Busan' },
        '서울': { ja: 'ソウル', en: 'Seoul' },
        '세종': { ja: '世宗', en: 'Sejong' },
        '울산': { ja: '蔚山', en: 'Ulsan' },
        '인천': { ja: '仁川', en: 'Incheon' },
        '전남': { ja: '全羅南道', en: 'South Jeolla' },
        '전북': { ja: '全羅北道', en: 'North Jeolla' },
        '제주': { ja: '済州', en: 'Jeju' },
        '충남': { ja: '忠清南道', en: 'South Chungcheong' },
        '충북': { ja: '忠清北道', en: 'North Chungcheong' }
    },
    // 영어는 템플스테이 가이드 페이지(templestayGuide.i18n.js)의 태그(EXPERIENCE/REST/DAY VISIT)와 맞춤
    type: {
        '당일형': { ja: '当日型', en: 'Day Visit' },
        '체험형': { ja: '体験型', en: 'Experience' },
        '휴식형': { ja: '休息型', en: 'Rest' }
    },
    ui: {
        ko: {
            filterRegion: '지역', filterTemple: '사찰', filterType: '프로그램 유형', filterLanguage: '언어', filterHeadcount: '인원',
            all: '전체', supportEnglish: '영어 지원',
            programList: '프로그램 목록', noProgram: '조건에 맞는 프로그램이 없습니다.',
            detailPageTitle: '프로그램 상세보기', backToList: '← 목록으로',
            detailIntro: '프로그램 소개', detailLocation: '위치', detailSchedule: '일정표', detailItems: '준비물',
            detailPrice: '요금 안내', detailPriceType: '구분', detailPricePrice: '가격', detailPerPerson: '1인',
            detailNotes: '유의사항', detailRefund: '환불 규정',
            reserveBtn: '예약 신청', fullBtn: '정원이 마감되었습니다'
        },
        ja: {
            filterRegion: '地域', filterTemple: '寺院', filterType: 'プログラム種別', filterLanguage: '言語', filterHeadcount: '人数',
            all: 'すべて', supportEnglish: '英語対応',
            programList: 'プログラム一覧', noProgram: '条件に合うプログラムがありません。',
            detailPageTitle: 'プログラム詳細', backToList: '← 一覧へ',
            detailIntro: 'プログラム紹介', detailLocation: '場所', detailSchedule: 'スケジュール', detailItems: '持ち物',
            detailPrice: '料金案内', detailPriceType: '区分', detailPricePrice: '料金', detailPerPerson: '1名',
            detailNotes: '注意事項', detailRefund: '返金規定',
            reserveBtn: '予約申込', fullBtn: '定員に達しました'
        },
        en: {
            filterRegion: 'Region', filterTemple: 'Temple', filterType: 'Program Type', filterLanguage: 'Language', filterHeadcount: 'Participants',
            all: 'All', supportEnglish: 'English Support',
            programList: 'Program List', noProgram: 'No programs match your filters.',
            detailPageTitle: 'Program Details', backToList: '← Back to list',
            detailIntro: 'About the Program', detailLocation: 'Location', detailSchedule: 'Schedule', detailItems: 'What to Bring',
            detailPrice: 'Pricing', detailPriceType: 'Type', detailPricePrice: 'Price', detailPerPerson: 'Per person',
            detailNotes: 'Notes', detailRefund: 'Refund Policy',
            reserveBtn: 'Reserve', fullBtn: 'Fully booked'
        }
    }
};

function piLang() {
    return (typeof i18nCurrentLang !== 'undefined') ? i18nCurrentLang : 'ko';
}

function trRegion(region) {
    var e = PROGRAM_I18N.region[region], lang = piLang();
    return (lang !== 'ko' && e && e[lang]) ? e[lang] : region;
}

function trType(type) {
    var e = PROGRAM_I18N.type[type], lang = piLang();
    return (lang !== 'ko' && e && e[lang]) ? e[lang] : type;
}

/** 사찰명은 사찰찾기와 같은 사전(templeI18n.js) - 없으면 원문 */
function trTempleName(name) {
    return (typeof translateTempleName === 'function') ? translateTempleName(name, piLang()) : name;
}

function trUi(key) {
    var t = PROGRAM_I18N.ui[piLang()] || PROGRAM_I18N.ui.ko;
    return t[key] !== undefined ? t[key] : PROGRAM_I18N.ui.ko[key];
}

function trPeople(n) {
    var lang = piLang();
    return lang === 'ja' ? n + '名' : lang === 'en' ? n + (n === 1 ? ' person' : ' people') : n + '명';
}

function trWon(n) {
    var s = n.toLocaleString(), lang = piLang();
    return lang === 'ja' ? s + 'ウォン' : lang === 'en' ? 'KRW ' + s : s + '원';
}

/** 사찰명 · 지역 (사찰명은 사찰찾기 사전, 지역은 위 사전) */
function trTempleRegion(templeName, region) {
    return trTempleName(templeName) + ' · ' + trRegion(region);
}

/** HTML에 data-pi18n="키" / data-pi18n-type="당일형"이 붙은 고정 요소를 지금 언어 사전 값으로 채움.
    common.js의 MutationObserver가 이 글자를 다시 번역기에 넘기지 않도록 .no-translate도 붙인다. */
function applyProgramStaticI18n() {
    document.querySelectorAll('[data-pi18n]').forEach(function (el) {
        el.classList.add('no-translate');
        el.textContent = trUi(el.getAttribute('data-pi18n'));
    });
    document.querySelectorAll('[data-pi18n-type]').forEach(function (el) {
        el.classList.add('no-translate');
        el.textContent = trType(el.getAttribute('data-pi18n-type'));
    });
}

// 번역기가 텍스트를 다 적용한 뒤(common.js가 부름) 사전 값으로 다시 덮음. 각 페이지는
// window.onProgramI18nRefresh에 자기 동적 렌더링(필터 옵션/카드 등) 다시 그리기를 등록한다.
window.i18nAfterApplyHooks = window.i18nAfterApplyHooks || [];
window.i18nAfterApplyHooks.push(function () {
    applyProgramStaticI18n();
    if (typeof window.onProgramI18nRefresh === 'function') window.onProgramI18nRefresh();
});

// 첫 화면부터 번역기 대상에서 빠지도록 미리 표시(언어를 바꾸기 전엔 텍스트는 그대로 한글)
document.querySelectorAll('[data-pi18n], [data-pi18n-type]').forEach(function (el) {
    el.classList.add('no-translate');
});
