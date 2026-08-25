/* ============================================================
   common.js — 모든 페이지가 공유
   - 인증 드롭다운(auth-nav-fragment) 동작
   - 다국어 처리 엔진(번역 사전 자체는 페이지마다 따로 정의)

   주의: 아래 함수들은 HTML의 onclick 등 인라인 이벤트에서 직접 호출되므로
   반드시 전역 함수로 선언되어야 합니다. DOMContentLoaded 콜백 "안"에는
   DOM 요소를 찾는 작업만 넣습니다.
============================================================ */

let currentLang = 'ko';

/* ===== 다국어 처리 엔진 ===== */
function applyLanguage(lang){
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if(!t) return;

    document.querySelectorAll('.lang-opt').forEach(function(btn){
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(function(el){
        const key = el.getAttribute('data-i18n');
        if(t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
        const key = el.getAttribute('data-i18n-placeholder');
        if(t[key] !== undefined) el.placeholder = t[key];
    });

    // 언어가 바뀔 때 이 페이지만 추가로 해야 할 일이 있으면,
    // 그 페이지 스크립트에서 onLanguageApplied(lang)를 정의해두면 자동 호출됨
    if(typeof onLanguageApplied === 'function') onLanguageApplied(lang);
}

/* ===== 인증 드롭다운 (auth-nav-fragment) ===== */
let authWrap, authZone, authTrigger;

function openDropdown(){
    authZone.style.display = 'block';
    authTrigger.setAttribute('aria-expanded', 'true');
}
function closeDropdown(){
    authZone.style.display = 'none';
    authTrigger.setAttribute('aria-expanded', 'false');
}
function toggleAuthDropdown(){
    const isOpen = authZone.style.display === 'block';
    isOpen ? closeDropdown() : openDropdown();
}

document.addEventListener('DOMContentLoaded', function(){
    authWrap = document.getElementById('authNavWrap');
    authZone = document.getElementById('authDropdownZone');
    authTrigger = document.getElementById('authTrigger');

    if(!authWrap) return; // 이 fragment가 없는 페이지도 있을 수 있으니 방어

    authWrap.addEventListener('mouseenter', openDropdown);
    authWrap.addEventListener('mouseleave', closeDropdown);

    document.addEventListener('click', function(e){
        if(!authWrap.contains(e.target)) closeDropdown();
    });
});