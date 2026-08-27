/* ============================================================
   common.js — 모든 페이지가 공유하는 fragment 스크립트
   ------------------------------------------------------------
   언어 버튼(.language-button) 클릭을 감지해서:
     1) 어떤 버튼이 선택됐는지 active 표시만 이 파일이 직접 처리
     2) 실제 번역(텍스트를 뭘로 바꿀지)은 절대 여기서 하지 않고,
        각 페이지 스크립트가 정의하는 onLanguageChange(lang) 훅에 위임

   이렇게 나눈 이유:
   페이지마다 번역 방식이 다릅니다 — 어떤 페이지는 사전(TRANSLATIONS
   객체)을 쓰고, 어떤 페이지는 크롬 Translator API를 씁니다. common.js는
   "어떤 방식인지" 전혀 몰라야 하고, 그래야 페이지마다 방식이 달라도
   이 파일을 안 건드리고 그대로 재사용할 수 있습니다.

   각 페이지는 반드시 자기 스크립트(signup.js 등)에서
   onLanguageChange(lang) 함수를 정의해야 합니다. 안 정의하면 버튼은
   눌리고 active 표시는 바뀌지만, 실제 텍스트는 안 바뀝니다(콘솔에
   경고만 찍히고 에러는 안 남 — 다른 기능에 영향 없음).

   ============================================================
   ⬇⬇⬇ 새 페이지를 만드는 사람(또는 AI)이 읽어야 하는 부분 ⬇⬇⬇
   ============================================================

   ⚠️ 아래는 "이대로 복붙하면 완성"이 아니라, 두 방식이 각각 어떤
   원리로 동작하는지 보여주는 최소 예시입니다. 목적은 "이 페이지엔
   어떤 방식이 맞는지 고르고, 그 방식이 대략 어떻게 동작하는지
   이해하는 것"입니다. 실제로 적용하려면 각 방식 아래에 있는
   "실전 체크리스트"를 반드시 확인하세요 — 예시 코드만 옮겨 붙이면
   빠진 부분 때문에 "버튼은 눌리는데 아무 반응이 없는" 상태가 됩니다.


   [방식 A] 사전(TRANSLATIONS) 방식
   -------------------------------------------------------------
   동작 원리: 페이지가 가진 텍스트를 3개 언어로 미리 손으로 다 써서
   객체(TRANSLATIONS)에 저장해두고, 언어가 바뀌면 그 객체에서 값을
   꺼내 화면에 꽂아 넣습니다. API 호출 없음 — 100% 동기적으로 즉시 적용.

   언제 쓰나: 텍스트 양이 적당하고, 유효성 검사 메시지처럼 화면에
   없다가 JS가 나중에 채워 넣는 동적 문구가 많을 때. (signup.js,
   signupSelect.js가 이 방식 — 실제 완성 예시로 참고)

   최소 예시 (원리만 보여줌):
   ---------------------------------------------------------------
   const TRANSLATIONS = {
     ko: { title: "예시 제목" },
     ja: { title: "サンプルタイトル" },
     en: { title: "Sample Title" }
   };

   let currentLang = 'ko';

   function onLanguageChange(lang){       // common.js가 클릭 시 불러줌
     currentLang = lang;
     const t = TRANSLATIONS[lang];
     if(!t) return;

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
   ---------------------------------------------------------------

   실전 체크리스트 (이것 없이는 안 돌아감):
   □ HTML의 각 요소에 data-i18n="키이름" 을 직접 붙였는가
     (키 이름 있는 값 필수 — 방식 B와 다름)
   □ 위 TRANSLATIONS 예시엔 title 하나뿐 — 이 페이지의 모든 텍스트를
     실제로 다 채워 넣었는가 (라벨, 버튼, hint, placeholder 전부)
   □ "유효성 검사 실패 메시지"처럼 화면에 처음부터 있지 않고 JS가
     나중에 만들어 넣는 문구는 이 스냅샷 방식으로 못 잡습니다 —
     signup.js의 msg(key) 패턴처럼 별도 처리 필요


   [방식 B] 크롬 내장 Translator API 방식
   -------------------------------------------------------------
   동작 원리: 미리 번역문을 안 써두고, 화면의 한국어 원문을 그때그때
   브라우저 내장 AI(Translator API)에 보내서 실시간으로 번역받습니다.
   비동기(await 필요) — 첫 호출 시 모델 다운로드/번역에 시간이 걸릴 수
   있고, 한 번 번역한 결과는 캐시해서 재사용합니다.

   언제 쓰나: 텍스트 양이 많고 대부분 정적 콘텐츠일 때(예: home.html).
   손으로 3개 언어 다 쓰는 부담이 없는 대신, 아래 제약이 있습니다.

   최소 예시 (원리만 보여줌 — placeholder까지 포함):
   ---------------------------------------------------------------
   const SOURCE_LANG = 'ko';
   let currentLang = 'ko';
   const translationCache = {}; // translationCache[lang][원문] = 번역문

   function snapshotOriginalText(){
     document.querySelectorAll('[data-i18n]').forEach(function(el){
       el.setAttribute('data-original-text', el.textContent.trim());
     });
     document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
       el.setAttribute('data-original-placeholder', el.placeholder);
     });
   }

   async function onLanguageChange(lang){   // common.js가 클릭 시 불러줌
     if(lang === SOURCE_LANG){
       currentLang = lang;
       document.querySelectorAll('[data-i18n]').forEach(function(el){
         el.textContent = el.getAttribute('data-original-text');
       });
       document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
         el.placeholder = el.getAttribute('data-original-placeholder');
       });
       return;
     }

     if(!('Translator' in self)){
       console.warn('이 브라우저는 Translator API를 지원하지 않습니다.');
       return;
     }

     if(!translationCache[lang]){
       const availability = await Translator.availability({ sourceLanguage: SOURCE_LANG, targetLanguage: lang });
       if(availability === 'unavailable') return;

       const translator = await Translator.create({ sourceLanguage: SOURCE_LANG, targetLanguage: lang });

       const originals = new Set();
       document.querySelectorAll('[data-i18n]').forEach(function(el){
         const t = el.getAttribute('data-original-text');
         if(t) originals.add(t);
       });
       document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
         const t = el.getAttribute('data-original-placeholder');
         if(t) originals.add(t);
       });

       const uniqueList = Array.from(originals);
       const translatedList = await Promise.all(uniqueList.map(text => translator.translate(text)));
       const cache = {};
       uniqueList.forEach((original, i) => { cache[original] = translatedList[i]; });
       translationCache[lang] = cache;
     }

     currentLang = lang;
     document.querySelectorAll('[data-i18n]').forEach(function(el){
       const original = el.getAttribute('data-original-text');
       el.textContent = (translationCache[lang] && translationCache[lang][original]) || original;
     });
     document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
       const original = el.getAttribute('data-original-placeholder');
       el.placeholder = (translationCache[lang] && translationCache[lang][original]) || original;
     });
   }

   snapshotOriginalText();
   ---------------------------------------------------------------

   실전 체크리스트 (이것 없이는 안 돌아가거나 반쯤만 동작함):
   □ HTML의 각 요소에 data-i18n 을 값 없이(마커로만) 붙였는가
     (키 이름 필요 없음 — 방식 A와 다름)
   □ snapshotOriginalText()가 실행되는 시점에 그 요소들이 이미
     DOM에 존재하는가 (스크립트를 <head>에 그냥 두면 실패함 —
     defer 사용하거나 body 맨 아래 배치)
   □ 데스크톱 크롬(138+) 전용, 모바일/타 브라우저에선 아예 동작 안 함
     → 위 예시처럼 'Translator' in self 체크와 실패 시 안내가 필수
   □ Translator.create()는 사용자의 최근 클릭 같은 상호작용이 있어야
     동작함 — 페이지 로드 직후 자동 실행 시도하면 실패할 수 있음
     (그래서 이 훅은 "언어 버튼 클릭"이라는 상호작용에 얹혀서 동작함)
   □ JS가 나중에 내용을 바꿔 넣는 동적 영역(예: 캘린더 월 표시,
     검색결과 목록)엔 이 "1회 스냅샷" 구조가 안 맞음 — 그 영역은
     별도로 다국어 처리해야 함 (home.html의 #calendarMonthTitle
     관련 주석 참고)
   □ 위 예시엔 없지만 실제로는 try/catch로 네트워크 오류 등도
     처리해야 사용자에게 "왜 안 되는지" 보여줄 수 있음
   □ 더 완전한 형태(다운로드 진행률 표시 등)는 translate-api-test.html
     참고

   ============================================================
   ⬆⬆⬆ 여기까지 ⬆⬆⬆
   ============================================================
============================================================ */

document.querySelectorAll('.language-button').forEach(function(btn){
    btn.addEventListener('click', function(){
        const lang = btn.getAttribute('data-lang');

        document.querySelectorAll('.language-button').forEach(function(b){
            b.classList.toggle('active', b === btn);
        });

        if(typeof onLanguageChange === 'function'){
            onLanguageChange(lang);
        } else {
            console.warn('[common.js] onLanguageChange(lang)가 이 페이지에 정의되어 있지 않습니다. 언어 버튼을 눌러도 텍스트는 바뀌지 않습니다.');
        }
    });
});

/* ===== 인증 드롭다운(auth-nav-fragment) 관련 코드는 여기 그대로 유지 =====
   (기존에 이미 작성해두신 openDropdown/closeDropdown 등은 이 파일에
   그대로 남겨두시면 됩니다 — 이번 수정과 무관합니다) */