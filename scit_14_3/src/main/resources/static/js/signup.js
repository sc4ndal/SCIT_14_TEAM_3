/* ============================================================
   signup.js — 회원가입 페이지 전용 (사전 방식 다국어 처리)
============================================================ */

const TRANSLATIONS = {
    ko: {
        titleLocal: "일반 회원가입", titleKakao: "카카오로 회원가입",
        subtitle: "사찰 커뮤니티 이용을 위한 정보를 입력해주세요",
        requiredNote: "표시는 필수 입력 항목입니다",
        sectionLogin: "로그인 정보", loginIdLabel: "아이디", loginIdPlaceholder: "영문/숫자 6~20자",
        loginIdInvalidMsg: "아이디는 영문 대소문자와 숫자만 사용해 6~20자로 입력해주세요",
        btnCheck: "중복확인", pwLabel: "비밀번호", pwCheckLabel: "비밀번호 확인",
        passwordInvalidMsg: "비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해 8~20자로 입력해주세요",
        passwordHint: "영문 대/소문자·숫자·특수문자(!@#$%^&*()) 모두 포함, 8~20자",
        passwordMismatchMsg: "비밀번호가 일치하지 않습니다", passwordMatchMsg: "✔ 비밀번호가 일치합니다",
        kakaoDone: "카카오 인증 완료", kakaoConnected: "연결됨",
        sectionMember: "회원 정보", nicknameLabel: "법명 (닉네임)", lockedHint: "가입 후 수정할 수 없습니다",
        nicknameInvalidMsg: "법명은 한글, 영어, 한자, 숫자만 사용해 10자 이내로 입력해주세요 (한글 자음/모음 단독 사용 불가)",
        nationalityLabel: "국적 구분", natKR: "내국인", natForeign: "외국인",
        nameLabel: "이름", nameHintKR: "한글로만 입력 가능합니다 (공백 없이)", nameHintForeign: "영문(로마자)으로만 입력 가능합니다",
        namePlaceholderKR: "예: 싯다르타", namePlaceholderForeign: "e.g. Siddhartha",
        birthLabel: "생년월일", birthDateFutureMsg: "미래 날짜는 생년월일로 입력할 수 없습니다",
        emailLabel: "이메일", emailLocalPlaceholder: "이메일 아이디", domainCustomPlaceholder: "도메인 입력", domainCustomOption: "직접입력",
        btnEmailCheck: "중복조회", btnSendMail: "메일발송", btnSent: "발송됨", btnResend: "재발송", btnVerified: "인증완료",
        emailEmptyMsg: "이메일을 입력해주세요", emailTakenMsg: "이미 등록된 이메일입니다", emailAvailableMsg: "사용 가능한 이메일입니다",
        verifyPlaceholder: "이메일로 받은 인증번호 6자리", verifyCodeSentMsg: "입력하신 이메일로 인증번호를 발송했습니다", verifyBtnConfirm: "확인",
        verifyExpiredMsg: "인증 시간이 만료되었습니다. 다시 시도해주세요", verifySuccessMsg: "인증이 완료되었습니다", verifyFailMsg: "인증번호가 일치하지 않습니다",
        phoneLabel: "연락처", phoneOptional: "(선택)", phonePlaceholder: "전화번호",
        termsRequired: "[필수]", termsText: "서비스 이용약관 및 개인정보 처리방침에 동의합니다",
        marketingOptional: "[선택]", marketingText: "이벤트·할인 등 광고성 정보를 이메일로 수신하는 것에 동의합니다",
        submitBtn: "가입 완료", cancelBtn: "취소",
        dupCheckFillFirst: "값을 먼저 입력해주세요", dupCheckOk: "✔ 사용 가능한 값입니다",
        dupCheckTaken: "이미 사용 중인 값입니다", dupCheckError: "확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
        mailSendError: "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요",
        cancelConfirmTitle: "정말 취소하시겠어요?", cancelConfirmText: "입력하신 정보는 삭제됩니다.",
        cancelConfirmYes: "네", cancelConfirmNo: "아니요",
        agreeTermsRequiredMsg: "필수 약관에 동의해주세요",
        loginIdCheckRequiredMsg: "아이디 중복확인을 완료해주세요",
        nicknameCheckRequiredMsg: "법명(닉네임) 중복확인을 완료해주세요",
        emailVerifyRequiredMsg: "이메일 인증을 완료해주세요"
    },
    ja: {
        titleLocal: "一般会員登録", titleKakao: "Kakaoで会員登録",
        subtitle: "寺院コミュニティ利用のための情報を入力してください",
        requiredNote: "は必須入力項目です",
        sectionLogin: "ログイン情報", loginIdLabel: "ID", loginIdPlaceholder: "英数字 6〜20文字",
        loginIdInvalidMsg: "IDは半角英字と数字のみを使用し、6〜20文字で入力してください",
        btnCheck: "重複確認", pwLabel: "パスワード", pwCheckLabel: "パスワード確認",
        passwordInvalidMsg: "パスワードは英大文字・小文字・数字・記号をすべて含め、8〜20文字で入力してください",
        passwordHint: "英大文字・小文字・数字・記号(!@#$%^&*())を含む8〜20文字",
        passwordMismatchMsg: "パスワードが一致しません", passwordMatchMsg: "✔ パスワードが一致しました",
        kakaoDone: "Kakao認証完了", kakaoConnected: "連携済み",
        sectionMember: "会員情報", nicknameLabel: "法名(ニックネーム)", lockedHint: "登録後は変更できません",
        nicknameInvalidMsg: "法名はハングル・英字・漢字・数字のみ使用可能で、10文字以内で入力してください(単独の子音・母音は使用不可)",
        nationalityLabel: "国籍区分", natKR: "韓国人", natForeign: "外国人",
        nameLabel: "お名前", nameHintKR: "ハングルのみ入力可能です(スペースなし)", nameHintForeign: "ローマ字のみ入力可能です",
        namePlaceholderKR: "例: 싯다르타", namePlaceholderForeign: "例: Siddhartha",
        birthLabel: "生年月日", birthDateFutureMsg: "未来の日付は生年月日として入力できません",
        emailLabel: "メールアドレス", emailLocalPlaceholder: "メールID", domainCustomPlaceholder: "ドメインを入力", domainCustomOption: "直接入力",
        btnEmailCheck: "重複照会", btnSendMail: "送信", btnSent: "送信済み", btnResend: "再送信", btnVerified: "認証完了",
        emailEmptyMsg: "メールアドレスを入力してください", emailTakenMsg: "既に登録されているメールアドレスです", emailAvailableMsg: "使用可能なメールアドレスです",
        verifyPlaceholder: "メールで届いた6桁の認証番号", verifyCodeSentMsg: "入力されたメールに認証番号を送信しました", verifyBtnConfirm: "確認",
        verifyExpiredMsg: "認証時間が終了しました。もう一度お試しください", verifySuccessMsg: "認証が完了しました", verifyFailMsg: "認証番号が一致しません",
        phoneLabel: "連絡先", phoneOptional: "(任意)", phonePlaceholder: "電話番号",
        termsRequired: "[必須]", termsText: "利用規約およびプライバシーポリシーに同意します",
        marketingOptional: "[任意]", marketingText: "イベント・割引などの広告性情報をメールで受け取ることに同意します",
        submitBtn: "登録完了", cancelBtn: "キャンセル",
        dupCheckFillFirst: "先に値を入力してください", dupCheckOk: "✔ 使用可能です",
        dupCheckTaken: "既に使用されている値です", dupCheckError: "確認中にエラーが発生しました。しばらくしてから再度お試しください",
        mailSendError: "メールの送信に失敗しました。しばらくしてから再度お試しください",
        cancelConfirmTitle: "本当にキャンセルしますか？", cancelConfirmText: "入力した情報は削除されます。",
        cancelConfirmYes: "はい", cancelConfirmNo: "いいえ",
        agreeTermsRequiredMsg: "必須約款に同意してください",
        loginIdCheckRequiredMsg: "IDの重複確認を完了してください",
        nicknameCheckRequiredMsg: "法名（ニックネーム）の重複確認を完了してください",
        emailVerifyRequiredMsg: "メール認証を完了してください"
    },
    en: {
        titleLocal: "Sign Up with Email", titleKakao: "Sign Up with Kakao",
        subtitle: "Please enter your information to join the temple community",
        requiredNote: "indicates a required field",
        sectionLogin: "Login Info", loginIdLabel: "ID", loginIdPlaceholder: "6-20 letters/numbers",
        loginIdInvalidMsg: "ID must be 6-20 characters using letters and numbers only",
        btnCheck: "Check", pwLabel: "Password", pwCheckLabel: "Confirm Password",
        passwordInvalidMsg: "Password must include uppercase, lowercase, a number, and a special character (8-20 characters)",
        passwordHint: "Include uppercase, lowercase, a number, and a special character (!@#$%^&*()), 8-20 characters",
        passwordMismatchMsg: "Passwords do not match", passwordMatchMsg: "\u2714 Passwords match",
        kakaoDone: "Kakao authentication complete", kakaoConnected: "Connected",
        sectionMember: "Member Info", nicknameLabel: "Dharma name (nickname)", lockedHint: "Cannot be changed after signup",
        nicknameInvalidMsg: "Dharma name may only use Korean, English, Chinese characters, or numbers, up to 10 characters (standalone Hangul consonants/vowels not allowed)",
        nationalityLabel: "Nationality", natKR: "Korean national", natForeign: "Foreign national",
        nameLabel: "Name", nameHintKR: "Korean characters only (no spaces)", nameHintForeign: "Roman letters only",
        namePlaceholderKR: "e.g. 싯다르타", namePlaceholderForeign: "e.g. Siddhartha",
        birthLabel: "Date of birth", birthDateFutureMsg: "Date of birth cannot be a future date",
        emailLabel: "Email", emailLocalPlaceholder: "Email ID", domainCustomPlaceholder: "Enter domain", domainCustomOption: "Enter manually",
        btnEmailCheck: "Check", btnSendMail: "Send code", btnSent: "Sent", btnResend: "Resend", btnVerified: "Verified",
        emailEmptyMsg: "Please enter your email", emailTakenMsg: "This email is already registered", emailAvailableMsg: "This email is available",
        verifyPlaceholder: "6-digit code from email", verifyCodeSentMsg: "A verification code was sent to your email", verifyBtnConfirm: "Verify",
        verifyExpiredMsg: "Verification time expired. Please try again", verifySuccessMsg: "Verification complete", verifyFailMsg: "Code does not match",
        phoneLabel: "Phone", phoneOptional: "(optional)", phonePlaceholder: "Phone number",
        termsRequired: "[Required]", termsText: "I agree to the Terms of Service and Privacy Policy",
        marketingOptional: "[Optional]", marketingText: "I agree to receive promotional emails such as events and discounts",
        submitBtn: "Complete Sign Up", cancelBtn: "Cancel",
        dupCheckFillFirst: "Please enter a value first", dupCheckOk: "\u2714 Available",
        dupCheckTaken: "This value is already taken", dupCheckError: "Something went wrong. Please try again shortly",
        mailSendError: "Failed to send the email. Please try again shortly",
        cancelConfirmTitle: "Are you sure you want to cancel?", cancelConfirmText: "Your entered information will be deleted.",
        cancelConfirmYes: "Yes", cancelConfirmNo: "No",
        agreeTermsRequiredMsg: "Please agree to the required terms",
        loginIdCheckRequiredMsg: "Please complete the ID duplicate check",
        nicknameCheckRequiredMsg: "Please complete the nickname duplicate check",
        emailVerifyRequiredMsg: "Please complete email verification"
    }
};

let currentLang = 'ko';

function msg(key){
    return TRANSLATIONS[currentLang][key];
}

/* common.js가 언어 버튼 클릭 시 호출하는 훅입니다.
   이 페이지는 "사전(TRANSLATIONS)" 방식으로 구현합니다.
   active 클래스 토글은 common.js가 이미 처리했으므로 여기선 안 건드립니다. */
function onLanguageChange(lang){
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if(!t) return; // 혹시 모를 방어 - 이 사전에 없는 언어면 그냥 무시

    const preferredField = document.getElementById('preferredLanguageField');
    if(preferredField) preferredField.value = lang;

    document.querySelectorAll('[data-i18n]').forEach(function(el){
        const key = el.getAttribute('data-i18n');
        if(t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
        const key = el.getAttribute('data-i18n-placeholder');
        if(t[key] !== undefined) el.placeholder = t[key];
    });

    updateNameHint();
    updateEmailButtonLabel();
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

// 아이디/닉네임 중복확인 통과 여부. 회원가입 제출을 막는 기준이라, 값이 조금이라도
// 바뀌면(clearResult) 바로 false로 되돌려야 함 - 안 그러면 값 바꾼 뒤 재확인 안 하고 제출 가능해짐.
const dupState = { loginId: false, nickname: false };

function checkLoginId(){
    if(!validateLoginId()) return;
    checkDuplicate('/api/check/login-id', 'loginId', 'loginIdResult', 'loginId');
}

// 이름: 입력값이 비면 해당 결과 메시지도 같이 지움 (중복확인 대상이 아니라 포맷 오류만 표시하는 필드)
function clearResultIfEmpty(inputId, resultId){
    if(document.getElementById(inputId).value === ''){
        setResult(document.getElementById(resultId), '', null);
    }
}

// 아이디/닉네임: 중복확인 결과가 붙는 필드라, 1글자라도 수정하면(비우지 않아도) 이전 확인 결과를 지움
function clearResult(resultId){
    setResult(document.getElementById(resultId), '', null);
    const key = resultId.replace('Result', '');
    if(key in dupState) dupState[key] = false;
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
    checkDuplicate('/api/check/nickname', 'nickname', 'nicknameResult', 'nickname');
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
   기대 응답 형식: { "available": true|false }
   stateKey가 있으면(dupState에 있는 키) 결과에 맞춰 dupState도 같이 갱신 - 제출 전 게이트에서 씀. */
async function checkDuplicate(endpoint, fieldId, resultId, stateKey){
    const value = document.getElementById(fieldId).value.trim();
    const resultEl = document.getElementById(resultId);

    if(!value){
        setResult(resultEl, msg('dupCheckFillFirst'), 'fail');
        if(stateKey in dupState) dupState[stateKey] = false;
        return;
    }

    try{
        const res = await fetch(`${endpoint}?value=${encodeURIComponent(value)}`);
        if(!res.ok) throw new Error('서버 응답 오류: ' + res.status);
        const data = await res.json();
        setResult(resultEl, data.available ? msg('dupCheckOk') : msg('dupCheckTaken'), data.available ? 'ok' : 'fail');
        if(stateKey in dupState) dupState[stateKey] = !!data.available;
    } catch(err){
        if(stateKey in dupState) dupState[stateKey] = false;
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
onLanguageChange('ko'); // data-i18n 텍스트/placeholder, nameHint, sendMailBtn 라벨까지 한 번에 확정
// (첫 로드 시 active 표시는 HTML에 이미 class="language-button active"로 박혀있어 별도 처리 불필요)

/* ===== 제출 =====
   서버(UserService)도 아이디/닉네임/이메일 중복과 이메일 인증 여부를 다시 검증하지만
   (signupError로 되돌아옴), 여기서는 그 전에 미리 막아서 사용자가 안내 없이 서버 왕복만
   당하는 일이 없게 한다. 순서: 닉네임 중복확인 -> (로컬만) 아이디 중복확인, 비번 확인 일치,
   이메일 인증 -> 약관 동의. 하나라도 안 됐으면 그 사유만 alert로 띄우고 제출을 막는다. */
function findSubmitBlockReason(){
    if(!dupState.nickname) return msg('nicknameCheckRequiredMsg');

    const isLocal = document.getElementById('loginType').value === 'LOCAL';
    if(isLocal){
        if(!dupState.loginId) return msg('loginIdCheckRequiredMsg');
        if(!validatePasswordMatch()) return msg('passwordMismatchMsg');
    }
    // 카카오 가입도 로컬과 동일하게 이메일 인증을 필수로 함 (카카오 계정에 동의된 이메일이 있으면
    // 아래 kakaoSection 프리필 스크립트가 자동으로 채우고 인증 처리해줌)
    if(document.getElementById('emailVerified').value !== 'true') return msg('emailVerifyRequiredMsg');

    if(!document.getElementById('agreeTerms').checked) return msg('agreeTermsRequiredMsg');

    return null;
}

document.querySelector('form').addEventListener('submit', function(e){
    const blockReason = findSubmitBlockReason();
    if(blockReason){
        e.preventDefault();
        Swal.fire({ icon: 'warning', text: blockReason });
    }
});

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
        cancelButtonText: msg('cancelConfirmNo'),
        customClass: {
            confirmButton: 'swal-btn-fixed',
            cancelButton: 'swal-btn-fixed'
        }
    }).then((result) => {
        if(result.isConfirmed){
            window.location.href = cancelUrl;
        }
    });
});