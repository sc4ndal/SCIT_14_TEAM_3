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
                setResult('✔ 현재 사용 중인 법명입니다', 'ok');
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
                setResult('✔ 현재 사용 중인 법명입니다', 'ok');
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
