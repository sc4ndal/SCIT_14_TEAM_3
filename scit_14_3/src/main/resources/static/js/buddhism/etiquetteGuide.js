/* ===================================================================
   사찰 예절 가이드 — B안(한 페이지, 전부 아코디언) 구현.

   카드 목록은 서버가 BUDDHISM_INFO(category='예절가이드')에서 읽어
   etiquetteGuide.html에서 window.ETIQUETTE_CATEGORIES로 내려준다.
   각 항목은 {letter, title, content} 형태이고, content는
   "• 액션" / "  → 이유" 원문 그대로라 parseContent()가 파싱한다.
   =================================================================== */

const CATEGORIES = window.ETIQUETTE_CATEGORIES || [];

// "• 액션" / "  → 이유" 형식 텍스트를 [{action, reason}] 배열로 변환.
// DB content 컬럼 값을 그대로 넣어도 동작함(들여쓰기/공백은 trim으로 무시).
function parseContent(raw) {
    if (!raw) {
        return [];
    }
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const items = [];
    let current = null;
    for (const line of lines) {
        if (line.startsWith("•")) {
            current = { action: line.replace(/^•\s*/, ""), reason: null };
            items.push(current);
        } else if (line.startsWith("→") && current) {
            current.reason = line.replace(/^→\s*/, "");
        }
    }
    return items;
}

// DB에서 온 문자열은 innerHTML로 넣지 않고 textContent로 채운다
// (관리자가 넣은 본문에 <, & 같은 글자가 있어도 그대로 보이게).
function span(className, text) {
    const el = document.createElement("span");
    if (className) {
        el.className = className;
    }
    if (text != null) {
        el.textContent = text;
    }
    return el;
}

function renderCategory(cat) {
    const items = parseContent(cat.content);

    const section = document.createElement("section");
    section.className = "category-card";

    const h2 = document.createElement("h2");
    h2.appendChild(span("cat-letter", cat.letter));
    h2.appendChild(document.createTextNode(cat.title));
    section.appendChild(h2);

    const ul = document.createElement("ul");
    ul.className = "item-list";

    items.forEach((item) => {
        const li = document.createElement("li");
        const hasReason = !!item.reason;

        const btn = document.createElement("button");
        btn.className = "item-action" + (hasReason ? "" : " no-reason");
        btn.type = "button";
        btn.setAttribute("aria-expanded", "false");
        btn.appendChild(span("dot", null));
        btn.appendChild(span("", item.action));
        btn.appendChild(span("caret", "▸"));

        li.appendChild(btn);

        if (hasReason) {
            const reasonWrap = document.createElement("div");
            reasonWrap.className = "item-reason";
            const inner = document.createElement("div");
            inner.className = "item-reason-inner";
            const p = document.createElement("p");
            p.textContent = item.reason;
            inner.appendChild(p);
            reasonWrap.appendChild(inner);
            li.appendChild(reasonWrap);

            btn.addEventListener("click", () => {
                const isOpen = reasonWrap.classList.toggle("open");
                btn.setAttribute("aria-expanded", String(isOpen));
            });
        }

        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

function init() {
    const root = document.getElementById("category-list");
    if (!root) {
        return;
    }
    CATEGORIES.forEach((cat) => root.appendChild(renderCategory(cat)));
}

document.addEventListener("DOMContentLoaded", init);
