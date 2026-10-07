/* 홈 화면 챗봇 위젯 - 불교/사이트 안내 Q&A.
   대화 이력은 서버에 저장하지 않고, 매 요청마다 지금까지의 대화를 같이 보낸다. */
(function () {
    document.addEventListener("DOMContentLoaded", () => {

        const toggle = document.getElementById("chatToggle");
        const panel = document.getElementById("chatPanel");
        const messages = document.getElementById("chatMessages");
        const form = document.getElementById("chatForm");
        const input = document.getElementById("chatInput");

        if (!toggle || !panel || !form || !input) return;

        const history = [];
        let sending = false;
        // 유저가 보낸 메시지 + 봇 답변(둘 다 한국어 원문) 말풍선마다 {bubble, original}을 기억해둔다 -
        // 화면에 뜬 뒤에 언어를 바꿔도 그 원문을 다시 번역해서 덮어쓸 수 있어야 하기 때문(번역된
        // 텍스트로 덮인 뒤엔 원문을 DOM에서 다시 알아낼 방법이 없어서 따로 들고 있어야 함).
        const chatBubbles = [];

        function setOpen(open) {
            toggle.classList.toggle("open", open);
            panel.classList.toggle("open", open);
            panel.setAttribute("aria-hidden", String(!open));

            if (open) {
                input.focus();
            }
        }

        toggle.addEventListener("click", () => {
            setOpen(!panel.classList.contains("open"));
        });

        // 지금 보고 있는 언어의 고정 문구(home.i18n.js의 HOME_TRANSLATIONS) - home.js가 언어 전환 시 window.homeCurrentLang을 갱신함
        function chatText(key) {
            const t = HOME_TRANSLATIONS[window.homeCurrentLang] || HOME_TRANSLATIONS.ko;
            return t[key] !== undefined ? t[key] : HOME_TRANSLATIONS.ko[key];
        }

        function appendMessage(text, role) {
            const bubble = document.createElement("div");
            bubble.className = "chat-message chat-message--" + (role === "user" ? "user" : "bot");
            bubble.textContent = text;
            messages.appendChild(bubble);
            messages.scrollTop = messages.scrollHeight;
            return bubble;
        }

        // 답변은 서버가 항상 한국어로만 준다(ChatService 참고) - 화면이 한국어가 아니면 여기서
        // common.js의 번역기(크롬 내장 Translator)에 직접 넘겨서 화면 표시용으로만 바꾼다.
        //
        // 지금 언어는 i18nCurrentLang이 아니라 window.homeCurrentLang으로 판단해야 한다 - 홈 화면은
        // 자기만의 window.onLanguageChange(홈페이지 전용 사전, home.i18n.js)를 쓰기 때문에
        // common.js의 defaultOnLanguageChange가 아예 안 불려서 i18nCurrentLang은 계속 'ko'에 고정돼
        // 있다(그래서 번역이 필요없다고 잘못 판단해서 스킵되는 버그가 있었다).
        async function translateForDisplay(koreanText, bubble) {
            const lang = window.homeCurrentLang || "ko";
            // chatBeginLanguageChange가 언어 버튼 누르자마자 미리 pending(흐리게 보이는) 클래스를
            // 걸어두므로, 여기서 그냥 리턴해버리면 한국어로 돌아왔을 때 그 클래스가 안 지워진 채
            // 영영 흐리게 남아있게 된다 - 항상 지워주고 리턴한다.
            // 한글이 하나도 없는 글(일본어 화면에서 일본어로, 영어 화면에서 영어로 직접 입력한 질문 등)은 한국어 원문이
            // 아니라서 번역기(한국어 -> 대상 언어)에 넘기면 엉뚱하게 바뀐다 - 이미 그 언어이니 그대로 보여준다.
            // 봇 답변은 항상 한국어(한글 포함)라 그대로 번역 대상이고, 한국어로 입력한 질문도 번역된다.
            const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(koreanText);
            if (lang === "ko" || typeof ensureTranslated !== "function" || !hasKorean) {
                bubble.classList.remove("chat-message--pending");
                return koreanText;
            }

            bubble.textContent = chatText("chatTranslating");
            bubble.classList.add("chat-message--pending");
            try {
                const trimmed = koreanText.trim();
                // 번역 모델 다운로드/네트워크가 막히면 Promise가 영영 안 끝나서 "번역하는 중..."에
                // 계속 멈춰있게 된다 - 30초 지나면 포기하고 한국어 원문이라도 보여준다.
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("translate timeout")), 30000));
                await Promise.race([ensureTranslated([trimmed], lang), timeout]);
                const cached = (typeof i18nTranslationCache !== "undefined") ? i18nTranslationCache[lang] : null;
                return (cached && cached[trimmed] !== undefined) ? cached[trimmed] : koreanText;
            } catch (e) {
                console.warn("[chat.js] 답변 번역 중 오류가 발생했습니다.", e);
                return koreanText;
            } finally {
                bubble.classList.remove("chat-message--pending");
            }
        }

        // home.js의 onLanguageChange는 언어 버튼을 누르자마자 이것부터 부른다 - 실제 재번역은
        // 캘린더/행사 텍스트 번역(translateEventTexts, 몇 초 걸릴 수 있음)이 끝난 뒤에야 시작되는데,
        // 그 사이 챗봇 패널을 보고 있으면 답변이 그냥 예전 언어로 멈춰있는 것처럼 보였다 - 언어를
        // 누른 즉시 전부 "번역하는 중..."부터 보여준다.
        function chatBeginLanguageChange() {
            for (const entry of chatBubbles) {
                entry.bubble.textContent = chatText("chatTranslating");
                entry.bubble.classList.add("chat-message--pending");
            }
        }
        window.chatBeginLanguageChange = chatBeginLanguageChange;

        // home.js의 onLanguageChange 끝에서(캘린더/행사 번역까지 다 끝난 뒤) 호출 - 지금까지 오간
        // 메시지(유저가 보낸 것 + 봇 답변) 전부 원문(한국어) 기준으로 다시 번역해서 실제 결과로 덮어쓴다.
        async function retranslateBotReplies() {
            for (const entry of chatBubbles) {
                entry.bubble.textContent = await translateForDisplay(entry.original, entry.bubble);
            }
        }
        window.chatOnLanguageChange = retranslateBotReplies;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const text = input.value.trim();
            if (!text || sending) return;

            sending = true;
            input.value = "";
            input.disabled = true;

            const userBubble = appendMessage(text, "user");
            chatBubbles.push({ bubble: userBubble, original: text });
            // 번역을 기다리면 그동안 봇 응답 요청(fetch)조차 시작을 못 해서 최대 30초(타임아웃)
            // 그냥 멈춰있는 꼴이 된다 - 기다리지 않고 뒤에서 알아서 끝나면 말풍선을 덮어쓰게 둔다.
            translateForDisplay(text, userBubble).then((translated) => {
                userBubble.textContent = translated;
            });

            const pending = appendMessage(chatText("chatPending"), "bot");
            pending.classList.add("chat-message--pending");

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, history })
                });

                if (!response.ok) throw new Error("chat request failed");

                const data = await response.json();

                pending.textContent = await translateForDisplay(data.reply, pending);
                chatBubbles.push({ bubble: pending, original: data.reply });

                history.push({ role: "user", text });
                history.push({ role: "model", text: data.reply });
            } catch (err) {
                pending.textContent = chatText("chatError");
                pending.classList.remove("chat-message--pending");
            } finally {
                sending = false;
                input.disabled = false;
                input.focus();
            }
        });
    });
})();
