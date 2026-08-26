/* ============================================================
   signup.js — 회원가입 페이지 전용
   ------------------------------------------------------------
   ※ 다국어 처리는 별도 담당자가 다른 HTML과의 호환성을 고려해
     따로 작업 중입니다. 이 파일은 지금 단계에서 "한국어 고정" 상태로
     완성된 버전이고, 번역 연동은 이후 별도로 이뤄질 예정입니다.
     (아래 MESSAGES 객체와 msg() 함수만 나중에 교체하면 되도록
      메시지 문자열을 한 곳에 모아뒀습니다.)
============================================================ */

const MESSAGES = {
    loginIdInvalidMsg: "아이디는 영문 대소문자와 숫자만 사용해 6~20자로 입력해주세요",
    nicknameInvalidMsg: "법명은 한글, 영어, 한자, 숫자만 사용해 10자 이내로 입력해주세요 (한글 자음/모음 단독 사용 불가)",
    passwordInvalidMsg: "비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해 8~20자로 입력해주세요",
    passwordMismatchMsg: "비밀번호가 일치하지 않습니다",
    passwordMatchMsg: "✔ 비밀번호가 일치합니다",
    nameHintKR: "한글로만 입력 가능합니다 (공백 없이)",
    nameHintForeign: "영문(로마자)으로만 입력 가능합니다",
    namePlaceholderKR: "예: 싯다르타",
    namePlaceholderForeign: "e.g. Siddhartha",
    birthDateFutureMsg: "미래 날짜는 생년월일로 입력할 수 없습니다",
    emailEmptyMsg: "이메일을 입력해주세요",
    emailTakenMsg: "이미 등록된 이메일입니다",
    emailAvailableMsg: "사용 가능한 이메일입니다",
    verifyCodeSentMsg: "입력하신 이메일로 인증번호를 발송했습니다",
    verifyExpiredMsg: "인증 시간이 만료되었습니다. 다시 시도해주세요",
    verifySuccessMsg: "인증이 완료되었습니다",
    verifyFailMsg: "인증번호가 일치하지 않습니다",
    btnSendMail: "메일발송",
    btnSent: "발송됨",
    btnResend: "재발송",
    btnVerified: "인증완료",
    dupCheckFillFirst: "값을 먼저 입력해주세요",
    dupCheckOk: "✔ 사용 가능한 값입니다",
    dupCheckTaken: "이미 사용 중인 값입니다",
    dupCheckError: "확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
    mailSendError: "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요",
    cancelConfirmTitle: "정말 취소하시겠어요?",
    cancelConfirmText: "입력하신 정보는 삭제됩니다.",
    cancelConfirmYes: "확인",
    cancelConfirmNo: "계속 작성"
};

function msg(key){
    return MESSAGES[key];
}

/* ===== 결과 메시지 표시 공통 헬퍼 ===== */
function setResult(el, message, type){
    el.textContent = message || '';
    el.className = message ? ('check-result ' + type) : 'check-result';
}

/* ===== 아이디 1차 유효성 검사 ===== */
const LOGIN_ID_PATTERN = /^[A-Za-z0-9]{6,20}$/;

function validateLoginId(){
    const value = document.getElementById('loginId').value;
    const resultEl = document.getElementById('loginIdResult');
    if(value === ''){ setResult(resultEl, '', null); return false; }
    if(!LOGIN_ID_PATTERN.test(value)){
        setResult(resultEl, msg('loginIdInvalidMsg'), 'fail');
        return false;
    }
    setResult(resultEl, '', null);
    return true;
}

function checkLoginId(){
    if(!validateLoginId()) return;
    checkDuplicate('/api/check/login-id', 'loginId', 'loginIdResult');
}

// 아이디/법명/이름 공통: 입력값이 비면 해당 결과 메시지도 같이 지움
function clearResultIfEmpty(inputId, resultId){
    if(document.getElementById(inputId).value === ''){
        setResult(document.getElementById(resultId), '', null);
    }
}

/* ===== 법명(닉네임) 1차 유효성 검사 =====
   한글 완성형(가-힣) + 영어 + 한자(CJK 통합 한자) + 숫자만 허용.
   한글 자음/모음 낱자(호환용 자모)는 이 범위에 없어서 자동으로 막힘. */
const NICKNAME_PATTERN = /^[가-힣a-zA-Z\u4E00-\u9FFF0-9]{1,10}$/;

function validateNickname(){
    const value = document.getElementById('nickname').value;
    const resultEl = document.getElementById('nicknameResult');
    if(value === ''){ setResult(resultEl, '', null); return false; }
    if(!NICKNAME_PATTERN.test(value)){
        setResult(resultEl, msg('nicknameInvalidMsg'), 'fail');
        return false;
    }
    setResult(resultEl, '', null);
    return true;
}

function checkNickname(){
    if(!validateNickname()) return;
    checkDuplicate('/api/check/nickname', 'nickname', 'nicknameResult');
}

/* ===== 생년월일 ===== */
function validateBirthDate(){
    const value = document.getElementById('birth').value;
    const resultEl = document.getElementById('birthResult');
    if(value === ''){ setResult(resultEl, '', null); return false; }

    const inputDate = new Date(value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if(inputDate.getTime() > today.getTime()){
        setResult(resultEl, msg('birthDateFutureMsg'), 'fail');
        return false;
    }
    setResult(resultEl, '', null);
    return true;
}

/* ===== 비밀번호 유효성 검사 (대/소문자·숫자·특수문자 4종류 + 8~20자) ===== */
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,20}$/;

function validatePassword(){
    const value = document.getElementById('pw').value;
    const resultEl = document.getElementById('pwResult');
    if(value === ''){ setResult(resultEl, '', null); return false; }
    if(!PASSWORD_PATTERN.test(value)){
        setResult(resultEl, msg('passwordInvalidMsg'), 'fail');
        return false;
    }
    setResult(resultEl, '', null);
    return true;
}

function onPasswordInput(){
    if(document.getElementById('pw').value === ''){
        setResult(document.getElementById('pwResult'), '', null);
    }
    validatePasswordMatch();
}

function validatePasswordMatch(){
    const pw = document.getElementById('pw').value;
    const pwCheck = document.getElementById('pwCheck').value;
    const resultEl = document.getElementById('pwCheckResult');

    if(!PASSWORD_PATTERN.test(pw)){ setResult(resultEl, '', null); return false; }
    if(pwCheck === ''){ setResult(resultEl, '', null); return false; }
    if(pw !== pwCheck){ setResult(resultEl, msg('passwordMismatchMsg'), 'fail'); return false; }

    setResult(resultEl, msg('passwordMatchMsg'), 'ok');
    return true;
}

/* ===== 국적별 이름 유효성 검사 ===== */
const NAME_PATTERN_KR = /^[가-힣]{2,5}$/;
const NAME_PATTERN_FOREIGN = /^[A-Za-z\s]{2,50}$/;

function onNationalityChange(){
    document.getElementById('name').value = '';
    clearResultIfEmpty('name', 'nameResult');
    updateNameHint();
}

function updateNameHint(){
    const nat = document.querySelector('input[name="nationality"]:checked').value;
    const nameInput = document.getElementById('name');
    const hint = document.getElementById('nameHint');
    if(nat === 'KR'){
        nameInput.setAttribute('pattern', NAME_PATTERN_KR.source);
        nameInput.maxLength = 5;
        nameInput.placeholder = msg('namePlaceholderKR');
        hint.textContent = msg('nameHintKR');
    } else {
        nameInput.setAttribute('pattern', NAME_PATTERN_FOREIGN.source);
        nameInput.maxLength = 50;
        nameInput.placeholder = msg('namePlaceholderForeign');
        hint.textContent = msg('nameHintForeign');
    }
}

function validateName(){
    const value = document.getElementById('name').value;
    const resultEl = document.getElementById('nameResult');
    const nat = document.querySelector('input[name="nationality"]:checked').value;

    if(value === ''){ setResult(resultEl, '', null); return false; }

    const pattern = nat === 'KR' ? NAME_PATTERN_KR : NAME_PATTERN_FOREIGN;
    const failMsg = nat === 'KR' ? msg('nameHintKR') : msg('nameHintForeign');
    if(!pattern.test(value)){ setResult(resultEl, failMsg, 'fail'); return false; }

    setResult(resultEl, '', null);
    return true;
}

/* ===== 중복확인 (실제 서버 조회) =====
   endpoint는 예시 경로입니다. 실제 컨트롤러 매핑에 맞게 수정하세요.
   기대 응답 형식: { "available": true|false } */
async function checkDuplicate(endpoint, fieldId, resultId){
    const value = document.getElementById(fieldId).value.trim();
    const resultEl = document.getElementById(resultId);

    if(!value){ setResult(resultEl, msg('dupCheckFillFirst'), 'fail'); return; }

    try{
        const res = await fetch(`${endpoint}?value=${encodeURIComponent(value)}`);
        if(!res.ok) throw new Error('서버 응답 오류: ' + res.status);
        const data = await res.json();
        setResult(resultEl, data.available ? msg('dupCheckOk') : msg('dupCheckTaken'), data.available ? 'ok' : 'fail');
    } catch(err){
        console.error('중복확인 요청 실패:', err);
        setResult(resultEl, msg('dupCheckError'), 'fail');
    }
}

/* ===== 이메일 아이디+도메인 조합 ===== */
function updateFullEmail(){
    const local = document.getElementById('emailLocal').value.trim();
    const sel = document.getElementById('emailDomainSelect');
    const domain = sel.value === 'custom' ? document.getElementById('emailDomainCustom').value.trim() : sel.value;
    document.getElementById('email').value = (local && domain) ? (local + '@' + domain) : '';
}

function handleDomainChange(){
    const isCustom = document.getElementById('emailDomainSelect').value === 'custom';
    document.getElementById('emailDomainCustom').style.display = isCustom ? 'inline-block' : 'none';
    updateFullEmail();
    resetEmailFlow();
}

/* ===== 이메일 중복조회 + 인증 흐름 (실제 서버 통신) ===== */
let emailStage = 'idle'; // idle -> checked -> sent -> verified / expired
let emailTimerInterval = null;
let emailRemainingSec = 300;

async function checkEmailDuplicate(){
    updateFullEmail();
    const emailVal = document.getElementById('email').value;
    const resultEl = document.getElementById('emailResult');
    const sendBtn = document.getElementById('sendMailBtn');

    if(!emailVal){
        setResult(resultEl, msg('emailEmptyMsg'), 'fail');
        sendBtn.style.display = 'none';
        return;
    }

    try{
        const res = await fetch(`/api/check/email?value=${encodeURIComponent(emailVal)}`);
        if(!res.ok) throw new Error('서버 응답 오류: ' + res.status);
        const data = await res.json();

        if(!data.available){
            setResult(resultEl, msg('emailTakenMsg'), 'fail');
            sendBtn.style.display = 'none';
            return;
        }
        setResult(resultEl, msg('emailAvailableMsg'), 'ok');
        emailStage = 'checked';
        sendBtn.style.display = 'inline-block';
        sendBtn.disabled = false;
        updateEmailButtonLabel();
    } catch(err){
        console.error('이메일 중복확인 요청 실패:', err);
        setResult(resultEl, msg('dupCheckError'), 'fail');
    }
}

async function sendVerificationMail(){
    const sendBtn = document.getElementById('sendMailBtn');
    sendBtn.disabled = true;

    try{
        const res = await fetch('/api/email/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: document.getElementById('email').value })
        });
        if(!res.ok) throw new Error('메일 발송 실패: ' + res.status);

        document.getElementById('verifySection').style.display = 'block';
        document.getElementById('verifyCode').value = '';
        document.getElementById('verifyCode').disabled = false;
        setResult(document.getElementById('verifyResult'), msg('verifyCodeSentMsg'), 'ok');
        startEmailTimer();
        emailStage = 'sent';
        updateEmailButtonLabel();
    } catch(err){
        console.error('인증메일 발송 실패:', err);
        setResult(document.getElementById('emailResult'), msg('mailSendError'), 'fail');
        sendBtn.disabled = false;
    }
}

function startEmailTimer(){
    clearInterval(emailTimerInterval);
    emailRemainingSec = 300;
    updateTimerDisplay();
    emailTimerInterval = setInterval(function(){
        emailRemainingSec--;
        updateTimerDisplay();
        if(emailRemainingSec <= 0){
            clearInterval(emailTimerInterval);
            onEmailTimerExpire();
        }
    }, 1000);
}

function updateTimerDisplay(){
    const m = String(Math.floor(emailRemainingSec / 60)).padStart(2, '0');
    const s = String(emailRemainingSec % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = m + ':' + s;
}

function onEmailTimerExpire(){
    setResult(document.getElementById('verifyResult'), msg('verifyExpiredMsg'), 'fail');
    document.getElementById('verifyCode').disabled = true;
    emailStage = 'expired';
    const sendBtn = document.getElementById('sendMailBtn');
    sendBtn.disabled = false;
    updateEmailButtonLabel();
}

async function confirmCode(){
    const inputVal = document.getElementById('verifyCode').value.trim();
    const resultEl = document.getElementById('verifyResult');

    if(emailStage !== 'sent'){ setResult(resultEl, msg('verifyExpiredMsg'), 'fail'); return; }

    try{
        const res = await fetch('/api/email/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: document.getElementById('email').value, code: inputVal })
        });
        if(!res.ok) throw new Error('인증 확인 실패: ' + res.status);
        const data = await res.json(); // { verified: boolean }

        if(data.verified){
            clearInterval(emailTimerInterval);
            setResult(resultEl, msg('verifySuccessMsg'), 'ok');
            document.getElementById('verifyCode').disabled = true;
            // 주의: 이 hidden 값은 화면 표시용일 뿐입니다.
            // 서버는 이 값을 신뢰하지 말고, 세션에 저장된 인증 상태를 직접 확인해야 합니다.
            document.getElementById('emailVerified').value = 'true';
            emailStage = 'verified';
            const sendBtn = document.getElementById('sendMailBtn');
            sendBtn.disabled = true;
            updateEmailButtonLabel();
        } else {
            setResult(resultEl, msg('verifyFailMsg'), 'fail');
        }
    } catch(err){
        console.error('인증번호 확인 요청 실패:', err);
        setResult(resultEl, msg('dupCheckError'), 'fail');
    }
}

function updateEmailButtonLabel(){
    const btn = document.getElementById('sendMailBtn');
    if(emailStage === 'sent') btn.textContent = msg('btnSent');
    else if(emailStage === 'expired') btn.textContent = msg('btnResend');
    else if(emailStage === 'verified') btn.textContent = msg('btnVerified');
    else btn.textContent = msg('btnSendMail');
}

function resetEmailFlow(){
    if(emailStage === 'idle') return;
    emailStage = 'idle';
    clearInterval(emailTimerInterval);
    document.getElementById('sendMailBtn').style.display = 'none';
    document.getElementById('sendMailBtn').disabled = false;
    setResult(document.getElementById('emailResult'), '', null);
    document.getElementById('verifySection').style.display = 'none';
    document.getElementById('emailVerified').value = 'false';
}

/* ===== 마케팅 수신동의 ===== */
function onMarketingConsentChange(checked){
    document.getElementById('marketingConsentField').value = checked ? 'true' : 'false';
    document.getElementById('marketingConsentAtField').value = checked ? new Date().toISOString() : '';
}

/* ===== 초기 상태 동기화 ===== */
document.getElementById('birth').max = new Date().toISOString().split('T')[0];
updateNameHint(); // 기본 선택(내국인) 기준 placeholder/힌트 최초 확정
updateEmailButtonLabel(); // sendMailBtn 초기 라벨 확정

/* ===== 취소 버튼: 입력 중이던 내용이 있으면 확인창 (더티플래그) ===== */
let formIsDirty = false;

document.querySelector('form').addEventListener('input', () => { formIsDirty = true; });
document.querySelector('form').addEventListener('change', () => { formIsDirty = true; });

document.querySelector('.btn-cancel').addEventListener('click', function(e){
    e.preventDefault();
    const cancelUrl = this.href;

    if(!formIsDirty){
        window.location.href = cancelUrl;
        return;
    }

    Swal.fire({
        title: msg('cancelConfirmTitle'),
        text: msg('cancelConfirmText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: msg('cancelConfirmYes'),
        cancelButtonText: msg('cancelConfirmNo')
    }).then((result) => {
        if(result.isConfirmed){
            window.location.href = cancelUrl;
        }
    });
});