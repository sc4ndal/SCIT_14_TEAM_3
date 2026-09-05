/* ============================================================
   resetPassword.js — 비밀번호 재설정 화면 전용
   signup.js의 비밀번호 검증 로직(패턴/일치 확인)만 그대로 가져옴.
============================================================ */

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,20}$/;

function setResult(el, message, type){
    el.textContent = message || '';
    el.className = message ? ('check-result ' + type) : 'check-result';
}

function validateNewPassword(){
    const value = document.getElementById('newPassword').value;
    const resultEl = document.getElementById('newPasswordResult');
    if(value === ''){ setResult(resultEl, '', null); return false; }
    if(!PASSWORD_PATTERN.test(value)){
        setResult(resultEl, '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함하여 8~20자로 입력해주세요.', 'fail');
        return false;
    }
    setResult(resultEl, '', null);
    return true;
}

function onNewPasswordInput(){
    if(document.getElementById('newPassword').value === ''){
        setResult(document.getElementById('newPasswordResult'), '', null);
    }
    validateNewPasswordMatch();
}

function validateNewPasswordMatch(){
    const pw = document.getElementById('newPassword').value;
    const pwCheck = document.getElementById('newPasswordCheck').value;
    const resultEl = document.getElementById('newPasswordCheckResult');

    if(!PASSWORD_PATTERN.test(pw)){ setResult(resultEl, '', null); return false; }
    if(pwCheck === ''){ setResult(resultEl, '', null); return false; }
    if(pw !== pwCheck){ setResult(resultEl, '비밀번호가 일치하지 않습니다', 'fail'); return false; }

    setResult(resultEl, '✔ 비밀번호가 일치합니다', 'ok');
    return true;
}
