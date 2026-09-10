// 템플스테이 프로그램 상세보기 (독립 페이지 - reservation.html 안 모달이었던 걸 분리함).
// 뒤로가기를 눌렀을 때 엉뚱한 페이지로 안 새고 실제로 "이전 페이지"로 가도록 진짜 페이지로 둠.

// 스케줄/준비물/소개는 사찰 관리자가 직접 입력하는 값이라(스크래핑 데이터 포함) innerHTML로
// 줄바꿈 태그를 넣기 전에 반드시 이스케이프해야 함 - 안 하면 "<script>" 같은 값이 그대로 실행됨.
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function splitTextField(text) {
  if (!text) return [];
  return text.split(/\n|,/).map(s => s.trim()).filter(Boolean);
}

// 준비물처럼 쉼표로 나열된 텍스트를 쪼갤 때, 괄호 안에 있는 쉼표까지 구분자로 오인하면
// "개인물병 (유니폼은 대여" / "비누·치약 구비됨)" 처럼 항목이 반으로 잘려버림 -
// 괄호 밖에 있는 쉼표/개행만 실제 구분자로 인정한다.
function splitRespectingParens(text) {
  if (!text) return [];
  const items = [];
  let depth = 0, current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === '\n') && depth === 0) {
      items.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) items.push(current.trim());
  return items.filter(Boolean);
}

// 소개글은 "► 문구1 ► 문구2 ..." 처럼 "►"로 항목을 나눠 적은 경우가 있어서(4건),
// 있으면 "►"마다 줄바꿈해서 보여준다. "►"가 아예 없으면(대부분) 기존처럼 한 문단 그대로.
function formatDescription(text) {
  if (!text) return [];
  if (!text.includes('►')) return [text];
  return text.split('►').map(s => s.trim()).filter(Boolean).map(s => '► ' + s);
}

// 일정표는 DB에 "1일차;13:00~14:00 입실;14:10~15:10 오리엔테이션;...;2일차;..." 형식(세미콜론
// 구분)으로 정리해둠 - "N일차"만 굵은 제목으로, 나머지는 시간대 한 줄씩. 세미콜론이 없는 옛날
// 데이터/사찰이 직접 입력한 자유 형식은 예전 방식("N일차 ... / ... 2일차 ...")으로 한 번 더
// 시도해보고, 그것도 안 맞으면 개행/쉼표 분리로 최종 폴백.
const DAY_HEADING_RE = /^\d+\s*일\s*차$/;
const TIME_LEAD_RE = /^\d{1,2}:\d{2}/;

function formatSchedule(text) {
  if (!text) return [];

  if (text.includes(';')) {
    const tokens = text.split(';').map(s => s.trim()).filter(Boolean);
    const lines = [];
    tokens.forEach(token => {
      const heading = DAY_HEADING_RE.test(token);
      const prev = lines[lines.length - 1];
      // 시간으로 시작 안 하는 항목(예: "절복 지급", "회향")은 새 줄 대신
      // 바로 위 시간 항목 줄에 이어붙인다 - 원본에 시간이 원래 없던 부가 설명이라
      // 별도 줄로 떼면 시간 없이 붕 떠 보임.
      if (!heading && prev && !prev.heading && !TIME_LEAD_RE.test(token)) {
        prev.text += ', ' + token;
      } else {
        lines.push({ heading, text: token });
      }
    });
    return lines;
  }

  const dayRe = /(\d+)\s*일\s*차\s*[:.]?\s*/g;
  const parts = text.split(dayRe);

  if (parts.length < 3) {
    // "N일차" 패턴을 못 찾음 - 기존 방식으로 폴백
    return splitTextField(text).map(line => ({ heading: false, text: line }));
  }

  const lines = [];
  for (let i = 1; i < parts.length; i += 2) {
    const dayNum = parts[i];
    const content = parts[i + 1] || '';
    lines.push({ heading: true, text: dayNum + '일차' });
    content.split('/')
      .map(s => s.trim().replace(/\.$/, '').trim())
      .filter(Boolean)
      .forEach(entry => lines.push({ heading: false, text: entry }));
  }
  return lines;
}

async function init() {
  try {
    const [programRes, templesRes] = await Promise.all([
      fetch(`/templestayprograms/${PROGRAM_ID}`),
      fetch('/temples'),
    ]);
    if (!programRes.ok) throw new Error('프로그램 조회 실패: ' + programRes.status);
    const p = await programRes.json();
    // TempleStayProgramDTO에는 region이 없어서(사찰 쪽 필드) /temples와 조인해서 채움 - reservation.js와 동일 패턴
    const temples = await templesRes.json();
    const temple = temples.find(t => t.templeId === p.templeId);
    p.region = temple ? temple.region : '';

    render(p);
    loadDetailMap(p);
  } catch (err) {
    console.error(err);
    document.querySelector('.detail-card').innerHTML = '<p>프로그램 정보를 불러오지 못했습니다.</p>';
  }
}

function render(p) {
  const hero = document.querySelector('.detail-hero');
  const heroImg = document.getElementById('detail-image');
  if (p.imageUrl) {
    heroImg.src = p.imageUrl;
    heroImg.alt = p.title;
  } else {
    hero.style.display = 'none';
  }

  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-sub').textContent = `${p.templeName} · ${p.region || ''} · ${p.programType}`;

  const remaining = p.maxParticipant - (p.reservedCount || 0);
  const full = remaining <= 0;
  document.getElementById('detail-capacity-dot').className = 'capacity-dot ' + (full ? 'full' : 'open');
  document.getElementById('detail-capacity-text').textContent = `${p.reservedCount || 0} / ${p.maxParticipant}명`;

  document.getElementById('detail-description').innerHTML =
    formatDescription(p.description).map(line => `<p>${escapeHtml(line)}</p>`).join('');
  document.getElementById('detail-schedule').innerHTML =
    formatSchedule(p.schedule)
      .map(line => `<p class="${line.heading ? 'schedule-day' : ''}">${escapeHtml(line.text)}</p>`)
      .join('');
  document.getElementById('detail-required-items').innerHTML =
    splitRespectingParens(p.requiredItems).map(item => `<li>${escapeHtml(item)}</li>`).join('');
  document.getElementById('detail-price').textContent = `${p.price.toLocaleString()}원`;
  document.getElementById('detail-precautions').textContent = p.templePrecautions || '';
  document.getElementById('detail-refund-policy').textContent = p.templeRefundPolicy || '';

  const reserveBtn = document.getElementById('detail-reserve-btn');
  if (full) {
    reserveBtn.disabled = true;
    reserveBtn.textContent = '정원이 마감되었습니다';
  } else {
    reserveBtn.addEventListener('click', () => {
      location.href = `/reservation?startBooking=${PROGRAM_ID}`;
    });
  }
}

init();
