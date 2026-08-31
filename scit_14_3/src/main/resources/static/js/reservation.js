/*
  ===========================================================================
  예약페이지 스크립트 (뼈대 + 실제 스키마 기준 초안)
  ===========================================================================
  - 참고한 아티팩트(state 하나로 관리하고 매번 다시 그리는 렌더링 패턴)를 따르되,
    실제 6개 테이블(TEMPLE, TEMPLE_STAY_PROGRAM, TEMPLE_STAY_RESERVATION,
    RESERVATION_PARTICIPANT, PAYMENT) 스키마 필드명을 그대로 씀.
  - 아직 백엔드에 없는 API는 아래 API 객체에 주석으로 표시해뒀어.
    실제로 컨트롤러 만들면 그 URL로만 바꿔주면 됨.
*/
 
// ------------------------- API 엔드포인트 -------------------------
const API = {
  // TODO: 아직 findAll 안 만들었으니, 이거 만들면 실제 fetch로 교체
  //   GET /temples            -> TempleDTO 목록
  //   GET /templestayprograms -> TempleStayProgramDTO 목록
  temples: '/temples',
  programs: '/templestayprograms',
  // TODO: 예약 생성 API 아직 안 만듦 (다음 작업 예정)
  //   POST /templestayreservations  body: ReservationCreateRequest
  createReservation: '/templestayreservations',
  // TODO: 결제 등록 API 아직 안 만듦
  //   POST /payments  body: { reservationId, paymentMethod, depositorName, kakaoTid }
  createPayment: '/payments',
};
 
// ------------------------- 목데이터 (findAll 만들기 전까지 임시) -------------------------
// 실제로는 GET /temples + GET /templestayprograms 응답을 합쳐서 아래와 같은 모양을 만들면 됨.
// TempleStayProgramDTO 필드명(programId, templeId, title, programType, price, duration, maxParticipant,
// description, schedule, requiredItems, refundPolicy, precautions) 그대로 사용.
const MOCK_PROGRAMS = [
  {
    programId: 1, templeId: 1, templeName: '국제선센터', region: '부산광역시',
    programType: '휴식형', title: '새벽, 마음을 걷다', duration: '1박2일',
    price: 68000, maxParticipant: 20,
    description: '새벽 예불과 108배로 하루를 시작하며 마음을 정돈하는 1박 2일 프로그램입니다.',
    schedule: '1일차 15:00 입소 및 오리엔테이션\n1일차 18:00 저녁 발우공양\n1일차 19:30 저녁 예불\n2일차 04:30 새벽 예불·108배\n2일차 09:00 아침 공양 후 퇴소',
    requiredItems: '개인 세면도구, 편한 활동복, 양말(법당 착석용), 상비약(필요시)',
    refundPolicy: '입소 7일 전까지 전액 환불, 3일 전까지 50% 환불, 이후 환불 불가.',
    precautions: '문신 노출이 심한 복장은 삼가 주세요. 음주 후 입소는 제한될 수 있습니다.',
  },
  {
    programId: 2, templeId: 1, templeName: '국제선센터', region: '부산광역시',
    programType: '당일형', title: '숲길 명상 하루', duration: '당일',
    price: 32000, maxParticipant: 20,
    description: '숲길을 걸으며 진행하는 당일 명상 체험 프로그램입니다.',
    schedule: '10:00 입소 및 다도 안내\n10:30 숲길 걷기 명상\n12:00 점심 발우공양\n13:30 차담 및 마무리',
    requiredItems: '걷기 편한 신발, 개인 물병',
    refundPolicy: '입소 3일 전까지 전액 환불, 이후 환불 불가.',
    precautions: '우천 시 일정이 변경될 수 있습니다.',
  },
  {
    programId: 3, templeId: 2, templeName: '직지사', region: '경상북도',
    programType: '체험형', title: '발우공양 체험', duration: '당일',
    price: 40000, maxParticipant: 20,
    description: '전통 발우공양 예절을 직접 체험해보는 프로그램입니다.',
    schedule: '09:30 입소 및 발우 소개\n10:00 발우공양 실습\n11:30 사찰 예절 체험\n13:00 해산',
    requiredItems: '무릎 꿇기 편한 하의, 개인 손수건',
    refundPolicy: '입소 3일 전까지 전액 환불, 이후 환불 불가.',
    precautions: '식이 제한(알레르기 등)이 있으면 사전에 알려주세요.',
  },
];
 
// ------------------------- state -------------------------
const state = {
  step: 1,                    // 1: 목록/상세, 2: 예약신청, 3: 신청완료
  programs: MOCK_PROGRAMS,    // GET /templestayprograms 결과로 교체 예정
  filter: { region: '', templeId: '', programType: '', headcount: '' },
  checkedProgramId: null,     // 목록에서 체크박스로 체크해둔 programId
  selectedProgram: null,      // 선택된 program 객체
  loginId: 'testuser01',      // TODO: 로그인 세션/토큰에서 가져오도록 교체
  startDate: '',
  endDate: '',
  participantCount: 1,
  // participants[0] = 대표자(예약 신청자 본인, phone 포함), participants[1..] = 나머지 참가자
  participants: [{ name: '', gender: '', email: '', phone: '' }],
  note: '',
  paymentMethod: '계좌이체',
  depositorName: '',
  kakaoTid: '',
  reservationResult: null,    // 신청 완료 후 서버 응답 저장
};

// ------------------------- 유틸 -------------------------

// program.duration 기준으로 endDate 자동 계산 (당일형=당일, 그 외=1박2일)
function computeEndDate(program, startDate) {
  if (!program || !startDate) return '';
  const start = new Date(startDate);
  if (program.duration === '당일') return startDate;
  start.setDate(start.getDate() + 1);
  return start.toISOString().slice(0, 10);
}

function filteredPrograms() {
  const f = state.filter;
  return state.programs.filter(p =>
    (!f.region || p.region === f.region) &&
    (!f.templeId || String(p.templeId) === f.templeId) &&
    (!f.programType || p.programType === f.programType) &&
    (!f.headcount || p.maxParticipant >= Number(f.headcount))
  );
}

function uniqueRegions() {
  return [...new Set(state.programs.map(p => p.region))];
}
function uniqueTemples(region) {
  const pool = region ? state.programs.filter(p => p.region === region) : state.programs;
  const seen = new Map();
  pool.forEach(p => seen.set(p.templeId, p.templeName));
  return [...seen.entries()]; // [[templeId, templeName], ...]
}

// TEXT 컬럼(줄바꿈/쉼표 구분 문자열)을 항목별 배열로 나눠주는 헬퍼
function splitTextField(text) {
  if (!text) return [];
  return text.split(/\n|,/).map(s => s.trim()).filter(Boolean);
}

// ------------------------- STEP 전환 (1/2/3) -------------------------
function goToStep(step) {
  state.step = step;
  document.querySelectorAll('main > section[data-step]').forEach(sec => {
    sec.hidden = Number(sec.dataset.step) !== step;
  });
  document.getElementById('step-1-detail').hidden = true;   // 추가: 상세보기 화면은 항상 숨김 처리
  document.querySelectorAll('#progress-steps li').forEach((li, i) => {
    li.classList.toggle('active', i === step - 1);
  });

  window.scrollTo(0, 0);   // 추가: 화면 맨 위로 스크롤 (단계 바뀌는 느낌 확실하게)

  // step 1로 돌아올 때는 항상 목록부터 보여줌 (상세보기는 초기화)
  if (step === 1) {
    showProgramList();
  }
}

// ------------------------- STEP 1: 목록 렌더링 -------------------------
function renderFilterOptions() {
  const regionSelect = document.getElementById('filter-region');
  const templeSelect = document.getElementById('filter-temple');
  const headcountSelect = document.getElementById('filter-headcount');

  regionSelect.innerHTML = '<option value="">전체</option>' +
    uniqueRegions().map(r => `<option value="${r}">${r}</option>`).join('');

  renderTempleOptions('');

  // 프로그램들의 max_participant 중 가장 큰 값까지 1명 단위로 옵션 생성 (지금은 전부 20명)
  const maxOfAll = Math.max(...state.programs.map(p => p.maxParticipant));
  const headcountOptions = Array.from({ length: maxOfAll }, (_, i) => i + 1);

  headcountSelect.innerHTML = '<option value="">전체</option>' +
    headcountOptions.map(n => `<option value="${n}">${n}명</option>`).join('');
}

// 지역 필터에 맞춰 사찰 셀렉박스 옵션만 다시 그림 (region이 빈 문자열이면 전체 사찰)
function renderTempleOptions(region) {
  const templeSelect = document.getElementById('filter-temple');
  templeSelect.innerHTML = '<option value="">전체</option>' +
    uniqueTemples(region).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
}

function renderProgramList() {
  const listEl = document.getElementById('program-list');
  const results = filteredPrograms();

  if (results.length === 0) {
    listEl.innerHTML = '<p>조건에 맞는 프로그램이 없습니다.</p>';
    return;
  }

  listEl.innerHTML = results.map(p => `
    <article class="program-card ${state.checkedProgramId === p.programId ? 'picked' : ''}" data-program-id="${p.programId}">
      <span class="program-type-badge">${p.programType}</span>
      <h3 class="program-title">${p.title}</h3>
      <p class="program-temple-region">${p.templeName} · ${p.region}</p>
      <div class="program-price">
        <span class="price-adult">${p.price.toLocaleString()}원</span>
      </div>
      <button type="button" class="program-detail-btn" data-program-id="${p.programId}">상세보기</button>
    </article>
  `).join('');

  // 상세보기 버튼은 카드 선택과 별개로 동작 (클릭 시 카드 선택으로 안 번지게 stopPropagation)
  listEl.querySelectorAll('.program-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showProgramDetail(Number(btn.dataset.programId));
    });
  });

  // 카드 자체를 클릭하면 그 프로그램이 선택됨 (한 번에 하나만 선택 가능)
  listEl.querySelectorAll('.program-card').forEach(card => {
    card.addEventListener('click', () => {
      state.checkedProgramId = Number(card.dataset.programId);
      listEl.querySelectorAll('.program-card').forEach(c => {
        c.classList.toggle('picked', c === card);
      });
      updateGoToReserveButton();
    });
  });

  updateGoToReserveButton();
}

function updateGoToReserveButton() {
  document.getElementById('go-to-reserve-btn').disabled = !state.checkedProgramId;
}

// ------------------------- STEP 1-상세: 프로그램 상세보기 -------------------------
// 목록/상세는 진행 표시상 둘 다 "01 프로그램 목록" 단계에 속하는 서브 화면이라
// state.step은 그대로 1로 유지하고, #step-1 / #step-1-detail 두 영역만 서로 토글한다.

function showProgramList() {
  document.getElementById('step-1').hidden = false;
  document.getElementById('step-1-detail').hidden = true;
}

function showProgramDetail(programId) {
  const program = state.programs.find(p => p.programId === programId);
  if (!program) return;

  document.getElementById('step-1').hidden = true;
  document.getElementById('step-1-detail').hidden = false;

  renderProgramDetail(program);
  loadDetailMap(programId);     // 추가: 사찰 위치 지도 그리기
}

function renderProgramDetail(p) {
  document.querySelector('#step-1-detail .detail-title').textContent = p.title;
  document.querySelector('#step-1-detail .detail-sub').textContent =
    `${p.templeName} · ${p.region} · ${p.programType}`;

  document.getElementById('detail-description').textContent = p.description || '';

  document.getElementById('detail-schedule').innerHTML =
    splitTextField(p.schedule).map(line => `<p>${line}</p>`).join('');

  document.getElementById('detail-required-items').innerHTML =
    splitTextField(p.requiredItems).map(item => `<li>${item}</li>`).join('');

  document.getElementById('detail-price').textContent = `${p.price.toLocaleString()}원`;

  document.getElementById('detail-precautions').textContent = p.precautions || '';
  document.getElementById('detail-refund-policy').textContent = p.refundPolicy || '';

  // "예약 신청" 버튼에 현재 programId를 기억시켜 둠
  document.getElementById('detail-reserve-btn').dataset.programId = p.programId;
}

document.getElementById('go-to-reserve-btn').addEventListener('click', () => {
  if (!state.checkedProgramId) return;
  selectProgram(state.checkedProgramId);
});

document.getElementById('detail-back-to-list-btn').addEventListener('click', showProgramList);

document.getElementById('step3-back-to-list-btn').addEventListener('click', () => {
  goToStep(1);
});
document.getElementById('detail-reserve-btn').addEventListener('click', (e) => {
  selectProgram(Number(e.target.dataset.programId));
});

function selectProgram(programId) {
  const program = state.programs.find(p => p.programId === programId);
  if (!program) return;

  state.selectedProgram = program;
  state.startDate = '';
  state.endDate = '';
  state.participantCount = 1;
  state.participants = [{ name: '', gender: '', email: '', phone: '' }];

  renderStep2();
  goToStep(2);
}

// ------------------------- STEP 2: 예약 신청 -------------------------
function renderStep2() {
  const p = state.selectedProgram;
  if (!p) return;

  const summary = document.getElementById('selected-program-summary');
  summary.querySelector('.program-title').textContent = p.title;
  summary.querySelector('.program-temple-region').textContent = `${p.templeName} · ${p.region}`;
  summary.querySelector('.program-price').textContent = `${p.price.toLocaleString()}원 / 1인`;

  document.getElementById('res-login-id').value = state.loginId;
  document.getElementById('res-program-id').value = p.programId;
  document.getElementById('res-start-date').value = state.startDate;
  document.getElementById('res-end-date').value = state.endDate;
  document.getElementById('res-participant-count').value = state.participantCount;
  document.getElementById('res-note').value = state.note;

  // 달력은 항상 오늘이 속한 달부터 보여주며 시작 (새 프로그램 선택할 때마다 초기화)
  const today = new Date();
  calendarState.year = today.getFullYear();
  calendarState.month = today.getMonth();
  document.getElementById('cal-selected-range').textContent = '날짜를 선택해 주세요.';
  renderCalendar();

  renderRepresentativeRow();
  renderParticipantRows();
  updatePaymentTotal();
  togglePaymentFields();
}

// 대표자(참가자[0])는 고정 위치의 정적 필드라 다시 그리지 않고 값만 채워 넣음
function renderRepresentativeRow() {
  const rep = state.participants[0] || { name: '', gender: '', email: '', phone: '' };
  document.getElementById('participant-name-0').value = rep.name || '';
  document.getElementById('participant-gender-0').value = rep.gender || '';
  document.getElementById('participant-email-0').value = rep.email || '';
  document.getElementById('participant-phone-0').value = rep.phone || '';
}

// ------------------------- 달력 -------------------------
const calendarState = { year: 0, month: 0 }; // month는 0(1월)~11(12월)

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function renderCalendar() {
  const { year, month } = calendarState;
  const monthLabel = document.getElementById('cal-month-label');
  const grid = document.getElementById('cal-grid');

  monthLabel.textContent = `${year}년 ${month + 1}월`;

  const firstWeekday = new Date(year, month, 1).getDay();   // 0(일)~6(토)
  const totalDays = new Date(year, month + 1, 0).getDate(); // 그 달의 마지막 날

  const todayStr = toDateStr(
    new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
  );

  const cells = [];

  // 요일 헤더
  ['일', '월', '화', '수', '목', '금', '토'].forEach(d => {
    cells.push(`<div class="cal-dow">${d}</div>`);
  });

  // 1일이 시작하기 전까지 빈 칸
  for (let i = 0; i < firstWeekday; i++) {
    cells.push('<div class="cal-day empty"></div>');
  }

  // 실제 날짜 칸
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = toDateStr(year, month, day);
    const isPast = dateStr < todayStr;
    const isSelected = state.startDate && state.endDate &&
      dateStr >= state.startDate && dateStr <= state.endDate;

    const classes = ['cal-day'];
    if (isPast) classes.push('disabled');
    if (isSelected) classes.push('selected');

    cells.push(
      `<div class="${classes.join(' ')}" ${isPast ? '' : `data-date="${dateStr}"`}>${day}</div>`
    );
  }

  grid.innerHTML = cells.join('');

  grid.querySelectorAll('.cal-day[data-date]').forEach(cell => {
    cell.addEventListener('click', () => selectStartDate(cell.dataset.date));
  });
}

// 날짜 하나를 클릭했을 때: 당일형이면 그날 하루, 그 외(1박2일)면 다음날까지 자동 선택
function selectStartDate(dateStr) {
  state.startDate = dateStr;
  state.endDate = computeEndDate(state.selectedProgram, dateStr);

  document.getElementById('res-start-date').value = state.startDate;
  document.getElementById('res-end-date').value = state.endDate;

  const rangeEl = document.getElementById('cal-selected-range');
  rangeEl.textContent = state.startDate === state.endDate
    ? `선택한 날짜: ${state.startDate} (당일)`
    : `선택한 날짜: ${state.startDate} ~ ${state.endDate} (1박2일)`;

  renderCalendar();
}

document.getElementById('cal-prev-month').addEventListener('click', () => {
  calendarState.month -= 1;
  if (calendarState.month < 0) {
    calendarState.month = 11;
    calendarState.year -= 1;
  }
  renderCalendar();
});

document.getElementById('cal-next-month').addEventListener('click', () => {
  calendarState.month += 1;
  if (calendarState.month > 11) {
    calendarState.month = 0;
    calendarState.year += 1;
  }
  renderCalendar();
});

function renderParticipantRows() {
  // participantCount에 맞춰 participants 배열 길이 맞추기 (participants[0]은 대표자)
  while (state.participants.length < state.participantCount) {
    state.participants.push({ name: '', gender: '', email: '', phone: '' });
  }
  state.participants.length = state.participantCount;

  const container = document.getElementById('participant-list');
  // legend/안내문구는 남기고 행만 다시 그림
  container.querySelectorAll('.participant-row').forEach(row => row.remove());

  state.participants.forEach((pt, i) => {
    if (i === 0) return; // 대표자는 #representative-info에서 별도로 다룸

    const row = document.createElement('div');
    row.className = 'participant-row';
    row.dataset.index = i;
    row.innerHTML = `
      <div class="form-item">
        <label for="participant-name-${i}">이름</label>
        <input type="text" id="participant-name-${i}" data-p-field="name" data-p-index="${i}" value="${pt.name}">
      </div>
      <div class="form-item">
        <label for="participant-gender-${i}">성별</label>
        <select id="participant-gender-${i}" data-p-field="gender" data-p-index="${i}">
          <option value="" ${pt.gender === '' ? 'selected' : ''}>선택</option>
          <option value="남성" ${pt.gender === '남성' ? 'selected' : ''}>남성</option>
          <option value="여성" ${pt.gender === '여성' ? 'selected' : ''}>여성</option>
        </select>
      </div>
      <div class="form-item">
        <label for="participant-email-${i}">이메일</label>
        <input type="email" id="participant-email-${i}" data-p-field="email" data-p-index="${i}" value="${pt.email}">
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('[data-p-field]').forEach(el => {
    el.addEventListener('input', () => {
      state.participants[Number(el.dataset.pIndex)][el.dataset.pField] = el.value;
    });
  });
}

// 대표자 입력 필드는 #representative-info에 고정으로 존재하므로, 매 렌더마다 새로 만들지 않고
// 페이지 로드 시 한 번만 리스너를 걸어둔다 (renderRepresentativeRow()가 값 채우는 역할을 담당).
['name', 'gender', 'email', 'phone'].forEach((field) => {
  document.getElementById(`participant-${field}-0`).addEventListener('input', (e) => {
    if (!state.participants[0]) {
      state.participants[0] = { name: '', gender: '', email: '', phone: '' };
    }
    state.participants[0][field] = e.target.value;
  });
});

function updatePaymentTotal() {
  const p = state.selectedProgram;
  if (!p) return;
  const total = p.price * state.participantCount;
  document.getElementById('payment-total-amount').textContent =
    `${p.price.toLocaleString()}원 x ${state.participantCount}명 = ${total.toLocaleString()}원`;
}

function togglePaymentFields() {
  document.querySelectorAll('.payment-field').forEach(field => {
    field.hidden = field.dataset.method !== state.paymentMethod;
  });
}

// ------------------------- STEP 2 이벤트 바인딩 -------------------------
// (시작일/종료일은 이제 달력 클릭으로 정해짐 - selectStartDate() 참고. 이 두 input은 hidden이라 change 리스너 불필요)

document.getElementById('res-participant-count').addEventListener('change', (e) => {
  const count = Math.max(1, Number(e.target.value) || 1);
  state.participantCount = count;
  renderParticipantRows();
  updatePaymentTotal();
});

document.getElementById('res-note').addEventListener('input', (e) => {
  state.note = e.target.value;
});

document.getElementById('payment-method').addEventListener('change', (e) => {
  state.paymentMethod = e.target.value;
  togglePaymentFields();
});

document.getElementById('payment-depositor-name').addEventListener('input', (e) => {
  state.depositorName = e.target.value;
});
document.getElementById('payment-kakao-tid').addEventListener('input', (e) => {
  state.kakaoTid = e.target.value;
});

document.getElementById('step2-back-btn').addEventListener('click', () => {
  goToStep(1);
});

document.getElementById('reservation-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await submitReservation();
});

// ------------------------- 제출 -------------------------
async function submitReservation() {
  const p = state.selectedProgram;

  // 최소한의 유효성 검사
  if (!state.startDate || !state.endDate) {
    alert('시작일을 선택해 주세요.');
    return;
  }
  if (state.participants.some(pt => !pt.name || !pt.gender || !pt.email)) {
    alert('대표자와 참가자 정보를 모두 입력해 주세요.');
    return;
  }
  if (!state.participants[0] || !state.participants[0].phone) {
    alert('대표자 연락처를 입력해 주세요.');
    return;
  }

  // TEMPLE_STAY_RESERVATION + RESERVATION_PARTICIPANT 생성 요청
  const reservationPayload = {
    loginId: state.loginId,
    programId: p.programId,
    startDate: state.startDate,
    endDate: state.endDate,
    participantCount: state.participantCount,
    note: state.note,
    participants: state.participants,
  };

  try {
    // TODO: 실제 POST /templestayreservations 만들어지면 아래 주석 해제
    // const res = await fetch(API.createReservation, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reservationPayload),
    // });
    // const reservation = await res.json();

    // 백엔드가 아직 없어서 임시로 화면에서 바로 결과를 만들어봄 (실제 연결 시 위 fetch로 교체)
    const reservation = {
      reservationId: Math.floor(Math.random() * 1000),
      status: '예약대기',
      ...reservationPayload,
    };

    // PAYMENT 생성 요청
    const paymentPayload = {
      reservationId: reservation.reservationId,
      paymentMethod: state.paymentMethod,
      depositorName: state.paymentMethod === '계좌이체' ? state.depositorName : null,
      kakaoTid: state.paymentMethod === '카카오페이' ? state.kakaoTid : null,
    };

    // TODO: 실제 POST /payments 만들어지면 아래 주석 해제
    // const payRes = await fetch(API.createPayment, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(paymentPayload),
    // });
    // const payment = await payRes.json();

    const payment = {
      amount: p.price * state.participantCount,
      status: '대기',
      ...paymentPayload,
    };

    state.reservationResult = { reservation, payment, program: p };
    renderStep3();
    goToStep(3);
  } catch (err) {
    alert('예약 신청 중 오류가 발생했습니다.');
    console.error(err);
  }
}

// ------------------------- STEP 3: 신청 완료 -------------------------
function renderStep3() {
  const { reservation, payment, program } = state.reservationResult;

  document.getElementById('result-reservation-id').textContent = `예약번호 ${reservation.reservationId}`;
  document.getElementById('result-program-title').textContent = program.title;
  document.getElementById('result-temple-name').textContent = `${program.templeName} · ${program.region}`;
  document.getElementById('result-date-range').textContent = `${reservation.startDate} ~ ${reservation.endDate}`;
  document.getElementById('result-participant-count').textContent = `${reservation.participantCount}명`;
  document.getElementById('result-total-amount').textContent = `${payment.amount.toLocaleString()}원`;
  document.getElementById('result-payment-method').textContent = payment.paymentMethod;
  document.getElementById('result-status').textContent = reservation.status;
}

document.getElementById('go-to-my-reservations-btn').addEventListener('click', () => {
  // TODO: 마이페이지/내 예약 목록 페이지로 이동
  alert('내 예약 목록 페이지는 아직 없습니다.');
});

// ------------------------- 필터 -------------------------
// 검색 버튼 없이, 셀렉박스를 바꾸는 즉시 필터가 적용되도록 함.
// 처음 로드될 때는 모든 필터가 빈 값이라 전체 프로그램이 다 보임.
function bindFilterChangeEvents() {
  document.getElementById('filter-region').addEventListener('change', (e) => {
    state.filter.region = e.target.value;
    // 지역이 바뀌면 이전에 골라둔 사찰이 그 지역과 안 맞을 수 있으니 초기화하고 옵션도 다시 그림
    state.filter.templeId = '';
    renderTempleOptions(state.filter.region);
    renderProgramList();
  });
  document.getElementById('filter-temple').addEventListener('change', (e) => {
    state.filter.templeId = e.target.value;
    renderProgramList();
  });
  document.getElementById('filter-program-type').addEventListener('change', (e) => {
    state.filter.programType = e.target.value;
    renderProgramList();
  });
  document.getElementById('filter-headcount').addEventListener('change', (e) => {
    state.filter.headcount = e.target.value;
    renderProgramList();
  });
}

// 서버에서 사찰 목록 + 프로그램 목록을 받아와서 하나로 합쳐줌
async function loadPrograms() {
  try {
    const [templesRes, programsRes] = await Promise.all([
      fetch(API.temples),
      fetch(API.programs),
    ]);

    const temples = await templesRes.json();
    const programs = await programsRes.json();

    const templeMap = new Map(temples.map(t => [t.templeId, t]));

    state.programs = programs.map(p => {
      const temple = templeMap.get(p.templeId);
      return {
        ...p,
        templeName: temple ? temple.name : '',
        region: temple ? temple.region : '',
      };
    });
  } catch (err) {
    console.error('프로그램 목록을 불러오는 데 실패했습니다.', err);
    alert('프로그램 목록을 불러오지 못했습니다. 목데이터로 대신 보여줄게요.');
    // 실패하면 state.programs는 원래 MOCK_PROGRAMS 그대로 유지됨
  }
}

// ------------------------- 초기화 -------------------------
async function init() {
  await loadPrograms();

  renderFilterOptions();
  bindFilterChangeEvents();
  renderProgramList();
  goToStep(1);
}

init();