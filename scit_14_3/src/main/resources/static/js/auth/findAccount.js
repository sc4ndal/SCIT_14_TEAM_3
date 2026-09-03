/* ============================================================
   findAccount.js — 아이디 찾기 / 비밀번호 찾기 통합 페이지 전용
   두 탭(id/pw)이 한 화면에 같이 존재하고 JS로 보여주는 영역만 바꿔치기함.
   이메일 입력칸(로컬파트 + 도메인 select/직접입력) 조합 로직은 signup.js와 동일한
   방식이지만, 한 화면에 이메일 입력칸이 두 벌(아이디용/비밀번호용) 있어서
   suffix('' 또는 'Pw')로 대상 id를 구분함.
============================================================ */

function setResult(el, message, type){
    el.textContent = message || '';
    el.className = message ? ('check-result ' + type) : 'check-result';
}

/* ===== 이메일 아이디+도메인 조합 (signup.js와 동일 로직) ===== */
function updateFullEmail(suffix){
    const local = document.getElementById('emailLocal' + suffix).value.trim();
    const sel = document.getElementById('emailDomainSelect' + suffix);
    const domain = sel.value === 'custom' ? document.getElementById('emailDomainCustom' + suffix).value.trim() : sel.value;
    document.getElementById('email' + suffix).value = (local && domain) ? (local + '@' + domain) : '';
}

function handleDomainChange(suffix){
    const isCustom = document.getElementById('emailDomainSelect' + suffix).value === 'custom';
    document.getElementById('emailDomainCustom' + suffix).style.display = isCustom ? 'inline-block' : 'none';
    updateFullEmail(suffix);
}

/* ===== 탭 전환 ===== */
function switchAccountTab(tab){
    const isId = tab === 'id';

    document.getElementById('tabBtnId').classList.toggle('active', isId);
    document.getElementById('tabBtnPw').classList.toggle('active', !isId);

    document.getElementById('findIdForm').style.display = isId ? '' : 'none';
    document.getElementById('findPwForm').style.display = isId ? 'none' : '';

    document.getElementById('tabDescId').style.display = isId ? '' : 'none';
    document.getElementById('tabDescPw').style.display = isId ? 'none' : '';
}

document.addEventListener('DOMContentLoaded', function(){
    const initialTab = document.body.dataset.activeTab === 'pw' ? 'pw' : 'id';
    switchAccountTab(initialTab);
});

/* ===== 아이디 찾기: 이메일 DB 등록 확인 -> (없으면 alert) -> 있으면 그 이메일로 아이디 원문 발송 =====
   인증번호 절차 없이, /api/check/email로 가입 이력만 먼저 확인하고 바로 /api/find-id를
   호출해서 서버가 이메일로 아이디를 보내게 함 - 메일함에 접근 가능한 사람만 그 내용을
   볼 수 있으니 그 자체가 본인 확인 역할을 함. */

function resetFindIdFlow(){
    setResult(document.getElementById('findIdEmailResult'), '', null);
}

async function findMyIdByEmail(){
    updateFullEmail('');
    const emailVal = document.getElementById('email').value;
    const resultEl = document.getElementById('findIdEmailResult');
    const submitBtn = document.getElementById('findIdSubmitBtn');

    if(!emailVal){
        setResult(resultEl, '이메일을 입력해주세요', 'fail');
        return;
    }

    submitBtn.disabled = true;
    try{
        const checkRes = await fetch(`/api/check/email?value=${encodeURIComponent(emailVal)}`);
        if(!checkRes.ok) throw new Error('서버 응답 오류: ' + checkRes.status);
        const checkData = await checkRes.json(); // { available: boolean } - true면 미등록 이메일

        if(checkData.available){
            setResult(resultEl, '', null);
            alert('가입이력이 없는 이메일입니다.');
            return;
        }

        const sendRes = await fetch('/api/find-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        });
        if(!sendRes.ok) throw new Error('아이디 발송 실패: ' + sendRes.status);
        const sendData = await sendRes.json(); // { sent: boolean }

        if(sendData.sent){
            setResult(resultEl, '가입하신 아이디를 이메일로 보내드렸습니다. 메일함을 확인해주세요.', 'ok');
        } else {
            setResult(resultEl, '', null);
            alert('가입이력이 없는 이메일입니다.');
        }
    } catch(err){
        console.error('아이디 찾기 요청 실패:', err);
        setResult(resultEl, '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요', 'fail');
    } finally {
        submitBtn.disabled = false;
    }
}

/* ===== 비밀번호 찾기: 이메일 DB 등록 확인 -> (없으면 alert) -> 있으면 재설정 링크(5분 유효) 발송 =====
   아이디는 요구하지 않고 이메일만으로 처리함. /api/find-pw가 조회+발송을 한 번에 처리하므로
   호출은 한 번만 하면 됨(못 찾으면 sent:false로 응답). */

function resetFindPwFlow(){
    setResult(document.getElementById('findPwResult'), '', null);
}

async function findMyPwByEmail(){
    updateFullEmail('Pw');
    const emailVal = document.getElementById('emailPw').value;
    const resultEl = document.getElementById('findPwResult');
    const submitBtn = document.getElementById('findPwSubmitBtn');

    if(!emailVal){
        setResult(resultEl, '이메일을 입력해주세요', 'fail');
        return;
    }

    submitBtn.disabled = true;
    try{
        const res = await fetch('/api/find-pw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal })
        });
        if(!res.ok) throw new Error('재설정 링크 발송 실패: ' + res.status);
        const data = await res.json(); // { sent: boolean }

        if(data.sent){
            setResult(resultEl, '비밀번호 재설정 링크를 이메일로 보내드렸습니다. 메일함을 확인해주세요. (5분간 유효)', 'ok');
        } else {
            setResult(resultEl, '', null);
            alert('등록되지 않은 이메일입니다.');
        }
    } catch(err){
        console.error('비밀번호 찾기 요청 실패:', err);
        setResult(resultEl, '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요', 'fail');
    } finally {
        submitBtn.disabled = false;
    }
}
