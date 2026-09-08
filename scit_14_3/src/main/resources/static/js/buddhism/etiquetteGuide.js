/* ===================================================================
   사찰 예절 가이드 — B안(한 페이지, 전부 아코디언) 렌더링.

   ⚠ 2026-09-02: zip으로 받은 실제 프로젝트를 열어보니, 이 파일이 아직
   CATEGORIES를 하드코딩해서 직접 그리는 예전 버전이었음(컨트롤러는 이미
   BUDDHISM_INFO에서 조회한 posts를 템플릿에 내려주고 있는데, 템플릿도
   JS도 그 값을 안 쓰고 있었음 — 화면은 우연히 똑같이 보였을 뿐, 실제로는
   DB랑 연결이 안 된 상태였음). 그래서 아래처럼 DB-driven 버전으로 교체함:

   HTML(etiquetteGuide.html)이 서버(Thymeleaf, BUDDHISM_INFO 조회)에서
   category별 <section class="category-card"> + <h2>(제목) +
   <ul class="item-list">(가공 안 된 raw content 텍스트) 를 이미 그려놓으면,
   이 스크립트가 페이지 로드 후 각 .item-list의 텍스트를 파싱해서
   불릿 + "클릭하면 이유가 펼쳐지는" 아코디언으로 다시 그려줌(progressive
   enhancement). 이제부터는 DB의 BUDDHISM_INFO.content 값만 바꾸면 화면에
   바로 반영됨 — 이 파일을 다시 고칠 필요 없음.
   =================================================================== */

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

function buildItemEl(item) {
    const li = document.createElement("li");
    const hasReason = !!item.reason;

    const btn = document.createElement("button");
    btn.className = "item-action" + (hasReason ? "" : " no-reason");
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `<span class="dot"></span><span>${item.action}</span><span class="caret">▸</span>`;
    li.appendChild(btn);

    if (hasReason) {
        const reasonWrap = document.createElement("div");
        reasonWrap.className = "item-reason";
        reasonWrap.innerHTML = `<div class="item-reason-inner"><p>${item.reason}</p></div>`;
        li.appendChild(reasonWrap);

        btn.addEventListener("click", () => {
            const isOpen = reasonWrap.classList.toggle("open");
            btn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    return li;
}

// 이미 서버가 그려놓은 .item-list(안에는 raw content 텍스트만 들어있음)를
// 찾아서, 그 안을 불릿+아코디언 <li>들로 교체함.
function enhance() {
    document.querySelectorAll(".item-list").forEach((ul) => {
        const raw = ul.textContent;
        const items = parseContent(raw);
        ul.innerHTML = "";
        items.forEach((item) => ul.appendChild(buildItemEl(item)));
    });
}

document.addEventListener("DOMContentLoaded", enhance);