// 템플스테이 프로그램 상세보기 (독립 페이지 - reservation.html 안 모달이었던 걸 분리함).
// 뒤로가기를 눌렀을 때 엉뚱한 페이지로 안 새고 실제로 "이전 페이지"로 가도록 진짜 페이지로 둠.

function splitTextField(text) {
  if (!text) return [];
  return text.split(/\n|,/).map(s => s.trim()).filter(Boolean);
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
    loadDetailMap(PROGRAM_ID);
  } catch (err) {
    console.error(err);
    document.querySelector('.detail-card').innerHTML = '<p>프로그램 정보를 불러오지 못했습니다.</p>';
  }
}

function render(p) {
  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-sub').textContent = `${p.templeName} · ${p.region || ''} · ${p.programType}`;

  const remaining = p.maxParticipant - (p.reservedCount || 0);
  const full = remaining <= 0;
  document.getElementById('detail-capacity-dot').className = 'capacity-dot ' + (full ? 'full' : 'open');
  document.getElementById('detail-capacity-text').textContent = `${p.reservedCount || 0} / ${p.maxParticipant}명`;

  document.getElementById('detail-description').textContent = p.description || '';
  document.getElementById('detail-schedule').innerHTML =
    splitTextField(p.schedule).map(line => `<p>${line}</p>`).join('');
  document.getElementById('detail-required-items').innerHTML =
    splitTextField(p.requiredItems).map(item => `<li>${item}</li>`).join('');
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
