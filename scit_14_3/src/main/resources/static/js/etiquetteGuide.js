/* ===================================================================
   사찰 예절 가이드 — B안(한 페이지, 전부 아코디언) 구현.

   CATEGORIES의 raw 텍스트는 buddhism_info_etiquette_guide_seed.sql의
   content 컬럼 값과 완전히 동일한 형식입니다("• 액션" / "  → 이유").
   실제로는 서버가 BUDDHISM_INFO에서 8개 row(category='예절가이드')를
   조회해 각 row의 title/content를 이 배열 자리에 채워 넣어주면 됩니다
   (Thymeleaf면 th:each로 서버 데이터를 이 구조로 렌더링하거나,
   지금처럼 JS 배열로 내려주고 parseContent()를 그대로 재사용해도 됨).
   =================================================================== */

const CATEGORIES = [
    {
        letter: "A",
        title: "방문 준비",
        raw: `
• 단정하고 편한 옷차림
  → 절하거나 바닥에 앉을 일이 많아서, 편한 옷이 예절에도 맞고 실제로도 편하다.
• 벗기 편한 신발 준비
  → 사찰 내부는 신발을 벗고 들어가는 공간이 많다.
• 법당에서는 양말 착용(맨발 금지)
  → 법당에 맨발로 들어가지 않는 것이 예의다.
`,
    },
    {
        letter: "B",
        title: "법당에 들어가기",
        raw: `
• 가운데 문(어간문) 대신 좌우측 문 이용
  → 어간문은 주지스님·원로스님, 큰 법회 때를 위한 문이다.
• 문은 소리 나지 않게 닫기
  → 안에서 참배하는 사람들을 방해하지 않기 위해서다.
• 들어서면 불상을 향해 합장 반배
  → 법당에 들어설 때의 기본 인사다.
• 이미 켜진 초·향은 그대로 두고 빈자리 찾기
  → 다른 사람의 발원(기원)을 방해하지 않고, 낭비도 막기 위해서다.
• 중앙 통로 대신 양옆으로 이동
  → 참배객 통행을 방해하지 않기 위해서다.
`,
    },
    {
        letter: "C",
        title: "절하는 법",
        raw: `
• 합장: 두 손바닥·손가락을 가지런히 붙이고 손목을 가슴에서 약 5cm 띄워 세움
  → 기본 자세다.
• 반배: 합장한 채 허리와 머리를 약 60도 숙임
  → 스님과 마주쳤을 때, 법당을 드나들 때 사용한다.
• 삼배(큰절)는 세 번 — 임의로 늘리거나 줄이지 않기
  → 부처님을 공경하고, 가르침을 따르고, 승가를 따른다는 세 가지 의미를 담은 정해진 횟수다.
`,
    },
    {
        letter: "D",
        title: "다른 사람 배려하기",
        raw: `
• 절하고 있는 사람 앞을 지나가지 않기
  → 수행을 방해하지 않도록 뒤쪽으로 돌아간다.
• 스님과 마주치면 합장 반배 (허리 숙여 인사 X)
  → 사찰에서의 올바른 인사법이다.
• 스님이 공양·좌선·휴식 중이거나 새벽예불 전이면 인사 생략
  → 방해가 되지 않게 하기 위해서다.
• 스님과 대화할 때는 존칭 사용, 짧게
  → 기본 예의다.
`,
    },
    {
        letter: "E",
        title: "공양간에서",
        raw: `
• 먹을 수 있는 만큼만 담기
  → 정성으로 준비된 음식을 남기지 않기 위해서다.
• 외부 음식 반입하지 않기
  → 사찰에서 제공하는 공양만 먹는 것이 원칙이다.
• 육류·마늘·파 등 오신채류는 보통 없음
  → 참고로 알아두면 좋다.
`,
    },
    {
        letter: "F",
        title: "법회 참석 시",
        raw: `
• 의식집·필기도구 미리 준비
• 시작 20~30분 전 도착, 늦었다면 조용히 착석
  → 자리를 정돈할 시간을 확보하기 위해서다.
• 중간에 일어나 나가지 않기
  → 실례가 되는 행동이다.
`,
    },
    {
        letter: "G",
        title: "나갈 때",
        raw: `
• 쓰레기는 정해진 장소에, 개인 물건 챙기기
• 조용히 퇴장
  → 들어올 때와 마찬가지다.
`,
    },
    {
        letter: "H",
        title: "경내에서 항상 지킬 것",
        raw: `
• 음주·육식·흡연·고성방가 금지
• 비치된 물품은 소중히 다루기
`,
    },
];

// "• 액션" / "  → 이유" 형식 텍스트를 [{action, reason}] 배열로 변환.
// DB content 컬럼 값을 그대로 넣어도 동작함(들여쓰기/공백은 trim으로 무시).
function parseContent(raw) {
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

function renderCategory(cat) {
    const items = parseContent(cat.raw);

    const section = document.createElement("section");
    section.className = "category-card";

    const h2 = document.createElement("h2");
    h2.innerHTML = `<span class="cat-letter">${cat.letter}</span>${cat.title}`;
    section.appendChild(h2);

    const ul = document.createElement("ul");
    ul.className = "item-list";

    items.forEach((item, idx) => {
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

        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

function init() {
    const root = document.getElementById("category-list");
    CATEGORIES.forEach((cat) => root.appendChild(renderCategory(cat)));
}

document.addEventListener("DOMContentLoaded", init);
