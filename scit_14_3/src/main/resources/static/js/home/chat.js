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

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const text = input.value.trim();
            if (!text || sending) return;

            sending = true;
            input.value = "";
            input.disabled = true;

            appendMessage(text, "user");
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

                pending.textContent = data.reply;
                pending.classList.remove("chat-message--pending");

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
