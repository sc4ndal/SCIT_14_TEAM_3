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
            const pending = appendMessage("생각하는 중...", "bot");
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
                pending.textContent = "지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.";
                pending.classList.remove("chat-message--pending");
            } finally {
                sending = false;
                input.disabled = false;
                input.focus();
            }
        });
    });
})();
