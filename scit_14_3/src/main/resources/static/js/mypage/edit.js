/* 광고성 정보 수신 동의(선택) 체크박스 - signup.js의 동명 함수와 동일한 계약(hidden 필드
   marketing_email_consent/_at 갱신). userEdit.html은 signup.js를 안 불러오므로 여기 둔다. */
function onMarketingConsentChange(checked) {
    document.getElementById('marketingConsentField').value = checked ? 'true' : 'false';
    document.getElementById('marketingConsentAtField').value = checked ? new Date().toISOString() : '';
}

document.addEventListener("DOMContentLoaded", function () {

    /* ============================================================
       비밀번호 변경: 새 비밀번호 / 확인 일치 체크
       ============================================================ */
    (function () {
        const form = document.getElementById('pwForm');
        if (!form) return;

        const p1 = document.getElementById('newPassword');
        const p2 = document.getElementById('newPasswordConfirm');
        const mismatch = document.getElementById('pwMismatch');

        function check() {
            const bad = p2.value && p1.value !== p2.value;
            mismatch.hidden = !bad;
            p2.setCustomValidity(bad ? 'mismatch' : '');
        }

        p1.addEventListener('input', check);
        p2.addEventListener('input', check);
    })();

    /* ============================================================
       이메일 변경 모달
       - "이메일 변경" 버튼 -> 모달 오픈. 아이디+도메인(select/직접입력) 중복조회 -> 메일발송 ->
         인증번호 확인까지 signup.js의 이메일 인증 흐름(/api/check/email, /api/email/send-verification,
         /api/email/verify-code)과 동일한 메커니즘을 그대로 옮겨서 씀 (id는 new* 접두어로 구분).
       - "변경"은 인증 완료(#newEmailVerified === 'true')된 경우에만 hidden #emailSubmit(실제
         제출되는 값)을 새 이메일로 채우고 "변경 예정" 안내만 띄운 뒤 닫는다. 읽기전용 #email(현재
         이메일 표시)은 건드리지 않음 - 인증을 마쳐도 profileForm "저장"을 눌러야 실제로 반영되는
         게 자연스러운 흐름이라, 저장 전까지는 "현재 이메일"이 바뀐 것처럼 보이면 안 됨.
       ============================================================ */
    (function () {
        const openBtn = document.getElementById('emailChangeBtn');
        const overlay = document.getElementById('emailModalOverlay');
        if (!openBtn || !overlay) return;

        const currentEmailInput = document.getElementById('email');
        const emailSubmitInput = document.getElementById('emailSubmit');
        const pendingField = document.getElementById('emailPendingField');
        const pendingDisplay = document.getElementById('emailPendingDisplay');
        const cancelBtn = document.getElementById('emailModalCancel');
        const confirmBtn = document.getElementById('emailModalConfirm');

        const localInput = document.getElementById('newEmailLocal');
        const domainCombo = document.getElementById('newEmailDomainCombo');
        const domainInput = document.getElementById('newEmailDomain');
        const domainList = document.getElementById('newEmailDomainList');
        const domainOptions = Array.from(domainList.querySelectorAll('li'));
        const fullEmailInput = document.getElementById('newEmail');
        const checkBtn = document.getElementById('newEmailCheckBtn');
        const emailResult = document.getElementById('newEmailResult');
        const sendBtn = document.getElementById('newEmailSendBtn');
        const verifySection = document.getElementById('newEmailVerifySection');
        const verifyCodeInput = document.getElementById('newEmailVerifyCode');
        const verifyBtn = document.getElementById('newEmailVerifyBtn');
        const verifyResult = document.getElementById('newEmailVerifyResult');
        const timerDisplay = document.getElementById('newEmailTimerDisplay');
        const verifiedField = document.getElementById('newEmailVerified');

        let stage = 'idle'; // idle -> checked -> sent -> verified / expired
        let timerInterval = null;
        let remainingSec = 300;

        function setResult(el, message, type) {
            el.textContent = message || '';
            el.className = message ? ('check-result ' + type) : 'check-result';
        }

        function updateFullEmail() {
            const local = localInput.value.trim();
            const domain = domainInput.value.trim();
            fullEmailInput.value = (local && domain) ? (local + '@' + domain) : '';
        }

        /* ── 도메인 콤보박스 (W3C ARIA APG combobox 패턴) ─────────────────
           목록에서 골라도 되고, 목록에 없는 도메인을 그냥 타이핑해도 되는 입력칸.
           select+"직접입력" 칸처럼 새 입력칸이 따로 생기지 않고 이 하나로 끝남. */
        let activeDomainIndex = -1;

        domainOptions.forEach(function (li, i) {
            li.id = 'newEmailDomainOpt' + i;
        });

        function openDomainList() {
            domainList.hidden = false;
            domainInput.setAttribute('aria-expanded', 'true');
        }

        function closeDomainList() {
            domainList.hidden = true;
            domainInput.setAttribute('aria-expanded', 'false');
            setActiveDomainOption(-1);
        }

        function setActiveDomainOption(index) {
            activeDomainIndex = index;
            domainOptions.forEach(function (li, i) {
                li.classList.toggle('combo-list__active', i === index);
            });
            if (index >= 0) {
                domainInput.setAttribute('aria-activedescendant', domainOptions[index].id);
                domainOptions[index].scrollIntoView({ block: 'nearest' });
            } else {
                domainInput.removeAttribute('aria-activedescendant');
            }
        }

        // 입력값으로 목록을 좁혀서, 필터링하면서도 목록에 없는 값을 계속 타이핑할 수 있게 함.
        // 하나도 안 남으면(목록에 없는 도메인을 직접 입력 중) true를 돌려줘서 호출부가
        // 빈 팝업을 닫게 한다 - 안 그러면 옵션 없이 패딩만 있는 빈 박스가 떠 있게 됨.
        function filterDomainList() {
            const q = domainInput.value.trim().toLowerCase();
            let anyVisible = false;
            domainOptions.forEach(function (li) {
                const match = !q || li.dataset.value.toLowerCase().includes(q);
                li.hidden = !match;
                if (match) anyVisible = true;
            });
            return anyVisible;
        }

        function visibleDomainOptions() {
            return domainOptions.filter(function (li) { return !li.hidden; });
        }

        function selectDomainOption(li) {
            domainInput.value = li.dataset.value;
            closeDomainList();
            updateFullEmail();
            resetEmailFlow();
        }

        domainOptions.forEach(function (li) {
            // mousedown이어야 domainInput의 blur(그리고 blur로 닫히는 목록)보다 먼저 확정됨.
            li.addEventListener('mousedown', function (e) {
                e.preventDefault();
                selectDomainOption(li);
            });
        });

        domainInput.addEventListener('focus', function () {
            if (filterDomainList()) openDomainList(); else closeDomainList();
        });

        domainInput.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (domainList.hidden) {
                    if (!filterDomainList()) return;
                    openDomainList();
                }
                const visible = visibleDomainOptions();
                if (!visible.length) return;
                const currentPos = visible.indexOf(domainOptions[activeDomainIndex]);
                const nextPos = e.key === 'ArrowDown'
                    ? (currentPos + 1) % visible.length
                    : (currentPos - 1 + visible.length) % visible.length;
                setActiveDomainOption(domainOptions.indexOf(visible[nextPos]));
            } else if (e.key === 'Enter') {
                if (!domainList.hidden && activeDomainIndex >= 0) {
                    e.preventDefault();
                    selectDomainOption(domainOptions[activeDomainIndex]);
                }
            } else if (e.key === 'Escape') {
                closeDomainList();
            }
        });

        // 콤보박스 바깥을 클릭하면 목록을 닫음(모달 오버레이 클릭 닫힘과는 별개).
        document.addEventListener('click', function (e) {
            if (!domainCombo.contains(e.target)) closeDomainList();
        });

        function updateSendBtnLabel() {
            if (stage === 'sent') sendBtn.textContent = '발송됨';
            else if (stage === 'expired') sendBtn.textContent = '재발송';
            else if (stage === 'verified') sendBtn.textContent = '인증완료';
            else sendBtn.textContent = '메일발송';
        }

        function resetEmailFlow() {
            stage = 'idle';
            clearInterval(timerInterval);
            sendBtn.style.display = 'none';
            sendBtn.disabled = false;
            setResult(emailResult, '', null);
            verifySection.style.display = 'none';
            verifiedField.value = 'false';
        }

        function updateTimerDisplay() {
            const m = String(Math.floor(remainingSec / 60)).padStart(2, '0');
            const s = String(remainingSec % 60).padStart(2, '0');
            timerDisplay.textContent = m + ':' + s;
        }

        function startTimer() {
            clearInterval(timerInterval);
            remainingSec = 300;
            updateTimerDisplay();
            timerInterval = setInterval(function () {
                remainingSec--;
                updateTimerDisplay();
                if (remainingSec <= 0) {
                    clearInterval(timerInterval);
                    setResult(verifyResult, '인증 시간이 만료되었습니다. 다시 시도해주세요', 'fail');
                    verifyCodeInput.disabled = true;
                    stage = 'expired';
                    sendBtn.disabled = false;
                    updateSendBtnLabel();
                }
            }, 1000);
        }

        async function checkEmailDuplicate() {
            updateFullEmail();
            const value = fullEmailInput.value;

            if (!value) {
                setResult(emailResult, '이메일을 입력해주세요', 'fail');
                sendBtn.style.display = 'none';
                return;
            }

            // 법명 중복확인과 동일한 원칙 - 지금 등록된 값 그대로면 서버에 물어볼 필요 없이
            // 바로 통과 처리하고, 이미 인증된 값이니 메일 재발송 없이 바로 "변경" 가능하게 함.
            if (value === currentEmailInput.value) {
                setResult(emailResult, '✔ 현재 등록된 이메일입니다', 'ok');
                stage = 'verified';
                verifiedField.value = 'true';
                sendBtn.style.display = 'none';
                verifySection.style.display = 'none';
                return;
            }

            checkBtn.disabled = true;
            try {
                const res = await fetch('/api/check/email?value=' + encodeURIComponent(value));
                if (!res.ok) throw new Error('status ' + res.status);
                const data = await res.json();

                if (!data.available) {
                    setResult(emailResult, '이미 등록된 이메일입니다', 'fail');
                    sendBtn.style.display = 'none';
                    return;
                }
                setResult(emailResult, '✔ 사용 가능한 이메일입니다', 'ok');
                stage = 'checked';
                sendBtn.style.display = 'inline-block';
                sendBtn.disabled = false;
                updateSendBtnLabel();
            } catch (e) {
                setResult(emailResult, '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'fail');
            } finally {
                checkBtn.disabled = false;
            }
        }

        async function sendVerificationMail() {
            sendBtn.disabled = true;
            try {
                const res = await fetch('/api/email/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: fullEmailInput.value })
                });
                if (!res.ok) throw new Error('status ' + res.status);

                verifySection.style.display = 'block';
                verifyCodeInput.value = '';
                verifyCodeInput.disabled = false;
                setResult(verifyResult, '입력하신 이메일로 인증번호를 발송했습니다', 'ok');
                startTimer();
                stage = 'sent';
                updateSendBtnLabel();
            } catch (e) {
                setResult(emailResult, '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요', 'fail');
                sendBtn.disabled = false;
            }
        }

        async function confirmVerifyCode() {
            const code = verifyCodeInput.value.trim();
            if (stage !== 'sent') {
                setResult(verifyResult, '인증 시간이 만료되었습니다. 다시 시도해주세요', 'fail');
                return;
            }

            try {
                const res = await fetch('/api/email/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: fullEmailInput.value, code: code })
                });
                if (!res.ok) throw new Error('status ' + res.status);
                const data = await res.json();

                if (data.verified) {
                    clearInterval(timerInterval);
                    setResult(verifyResult, '인증이 완료되었습니다', 'ok');
                    verifyCodeInput.disabled = true;
                    verifiedField.value = 'true';
                    stage = 'verified';
                    sendBtn.disabled = true;
                    updateSendBtnLabel();
                } else {
                    setResult(verifyResult, '인증번호가 일치하지 않습니다', 'fail');
                }
            } catch (e) {
                setResult(verifyResult, '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'fail');
            }
        }

        function open() {
            localInput.value = '';
            domainInput.value = '';
            fullEmailInput.value = '';
            closeDomainList();
            resetEmailFlow();
            overlay.hidden = false;
            localInput.focus();
        }

        function close() {
            clearInterval(timerInterval);
            closeDomainList();
            overlay.hidden = true;
        }

        localInput.addEventListener('input', function () { updateFullEmail(); resetEmailFlow(); });
        domainInput.addEventListener('input', function () {
            if (filterDomainList()) openDomainList(); else closeDomainList();
            updateFullEmail();
            resetEmailFlow();
        });
        checkBtn.addEventListener('click', checkEmailDuplicate);
        sendBtn.addEventListener('click', sendVerificationMail);
        verifyBtn.addEventListener('click', confirmVerifyCode);

        openBtn.addEventListener('click', open);
        cancelBtn.addEventListener('click', close);

        // 배경 클릭으로도 닫히게 (모달 내부 클릭은 버블링 안 하도록 target 비교)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        confirmBtn.addEventListener('click', function () {
            if (verifiedField.value !== 'true') {
                setResult(emailResult, '이메일 인증을 완료해주세요', 'fail');
                return;
            }
            emailSubmitInput.value = fullEmailInput.value;
            pendingDisplay.value = fullEmailInput.value;
            pendingField.hidden = false;
            close();
        });
    })();

    /* ============================================================
       기본정보: 법명(닉네임) 중복확인
       - API: GET /api/check/nickname?value=<법명>  ->  { "available": boolean }
       - 회원가입(signup.js)과 동일한 법명 규칙/UX 를 따른다.
       - 단, 로그인한 본인의 "현재 법명" 은 항상 통과로 취급한다.
       ============================================================ */
    (function () {
        const input = document.getElementById('nickname');
        const resultEl = document.getElementById('nicknameResult');
        const btn = document.getElementById('nicknameCheckBtn');
        const form = document.getElementById('profileForm');
        if (!input || !resultEl || !btn) return;

        // signup.js 의 NICKNAME_PATTERN 과 동일한 문자셋(한글 완성형·영문·CJK 한자·숫자).
        // 길이는 이 화면 입력칸(maxlength=30)에 맞춤.
        const NICKNAME_PATTERN = /^[가-힣a-zA-Z一-鿿0-9]{1,30}$/;
        const current = (input.dataset.currentNickname || '').trim();

        // 중복확인 통과 여부. 처음엔 값이 "현재 법명" 그대로라 통과 상태로 시작.
        let dupOk = true;

        function setResult(message, type) {
            resultEl.textContent = message || '';
            resultEl.className = message ? ('check-result ' + type) : 'check-result';
        }

        function validate() {
            const v = input.value.trim();
            if (v === '') { setResult('', null); return false; }
            if (!NICKNAME_PATTERN.test(v)) {
                setResult('한글·영문·한자·숫자만 사용할 수 있습니다.', 'fail');
                return false;
            }
            setResult('', null);
            return true;
        }

        // 값이 바뀌면 이전 중복확인 결과 무효화 (현재 법명으로 되돌리면 자동 통과)
        input.addEventListener('input', function () {
            if (input.value.trim() === current) {
                dupOk = true;
                setResult('✔ 현재 등록된 법명입니다', 'ok');
            } else {
                dupOk = false;
                setResult('', null);
            }
        });

        input.addEventListener('blur', function () {
            if (input.value.trim() !== current) validate();
        });

        btn.addEventListener('click', async function () {
            const v = input.value.trim();

            if (v === current) {
                dupOk = true;
                setResult('✔ 현재 등록된 법명입니다', 'ok');
                return;
            }
            if (!validate()) return;

            btn.disabled = true;
            try {
                const res = await fetch('/api/check/nickname?value=' + encodeURIComponent(v));
                if (!res.ok) throw new Error('status ' + res.status);
                const data = await res.json();
                dupOk = !!data.available;
                setResult(
                    data.available ? '✔ 사용 가능한 법명입니다' : '이미 사용 중인 법명입니다',
                    data.available ? 'ok' : 'fail'
                );
            } catch (e) {
                dupOk = false;
                setResult('확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'fail');
            } finally {
                btn.disabled = false;
            }
        });

        // 법명을 바꿨는데 중복확인을 안 했으면 저장 막기
        if (form) {
            form.addEventListener('submit', function (e) {
                if (input.value.trim() !== current && !dupOk) {
                    e.preventDefault();
                    setResult('법명 중복확인을 해주세요.', 'fail');
                    input.focus();
                }
            });
        }
    })();

});
