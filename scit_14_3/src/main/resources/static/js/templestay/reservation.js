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
 
// 서버가 내려주는 신청일시("2026-09-07T14:47:03...") -> "26/09/07 14:47" 로 표시
function formatAppliedAt(iso) {
  if (!iso) return '-';
  const yy = iso.slice(2, 4);
  const mm = iso.slice(5, 7);
  const dd = iso.slice(8, 10);
  const hh = iso.slice(11, 13);
  const mi = iso.slice(14, 16);
  return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

// ------------------------- API 엔드포인트 -------------------------
  const authInfo = document.getElementById('auth-info');
  const isLoggedIn = !!authInfo;
  const currentLoginId = authInfo ? authInfo.dataset.loginId : null;

const API = {
  createParticipants: '/reservationparticipants',
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
// description, schedule, requiredItems, templeRefundPolicy, templePrecautions) 그대로 사용 -
// 환불규정/주의사항은 프로그램이 아니라 사찰(TEMPLE) 공통값이라 이름이 temple로 시작함.
const MOCK_PROGRAMS = [
  {
    programId: 1, templeId: 1, templeName: '국제선센터', region: '부산광역시',
    programType: '휴식형', title: '새벽, 마음을 걷다', duration: '1박2일',
    price: 68000, maxParticipant: 20,
    description: '새벽 예불과 108배로 하루를 시작하며 마음을 정돈하는 1박 2일 프로그램입니다.',
    schedule: '1일차 15:00 입소 및 오리엔테이션\n1일차 18:00 저녁 발우공양\n1일차 19:30 저녁 예불\n2일차 04:30 새벽 예불·108배\n2일차 09:00 아침 공양 후 퇴소',
    requiredItems: '개인 세면도구, 편한 활동복, 양말(법당 착석용), 상비약(필요시)',
    templeRefundPolicy: '입소 7일 전까지 전액 환불, 3일 전까지 50% 환불, 이후 환불 불가.',
    templePrecautions: '문신 노출이 심한 복장은 삼가 주세요. 음주 후 입소는 제한될 수 있습니다.',
  },
  {
    programId: 2, templeId: 1, templeName: '국제선센터', region: '부산광역시',
    programType: '당일형', title: '숲길 명상 하루', duration: '당일',
    price: 32000, maxParticipant: 20,
    description: '숲길을 걸으며 진행하는 당일 명상 체험 프로그램입니다.',
    schedule: '10:00 입소 및 다도 안내\n10:30 숲길 걷기 명상\n12:00 점심 발우공양\n13:30 차담 및 마무리',
    requiredItems: '걷기 편한 신발, 개인 물병',
    templeRefundPolicy: '입소 3일 전까지 전액 환불, 이후 환불 불가.',
    templePrecautions: '우천 시 일정이 변경될 수 있습니다.',
  },
  {
    programId: 3, templeId: 2, templeName: '직지사', region: '경상북도',
    programType: '체험형', title: '발우공양 체험', duration: '당일',
    price: 40000, maxParticipant: 20,
    description: '전통 발우공양 예절을 직접 체험해보는 프로그램입니다.',
    schedule: '09:30 입소 및 발우 소개\n10:00 발우공양 실습\n11:30 사찰 예절 체험\n13:00 해산',
    requiredItems: '무릎 꿇기 편한 하의, 개인 손수건',
    templeRefundPolicy: '입소 3일 전까지 전액 환불, 이후 환불 불가.',
    templePrecautions: '식이 제한(알레르기 등)이 있으면 사전에 알려주세요.',
  },
];

// ------------------------- state -------------------------
const state = {
  step: 1,                    // 1: 목록/상세, 2: 예약신청, 3: 신청완료
  programs: MOCK_PROGRAMS,    // GET /templestayprograms 결과로 교체 예정
  filter: { region: '', templeId: '', programType: '', supportEnglish: '', headcount: ''},
  page: 1,                    // 프로그램 목록 페이지네이션 (한 페이지 = 3줄 x 3개 = 9개)
  checkedProgramId: null,     // 목록에서 체크박스로 체크해둔 programId
  selectedProgram: null,      // 선택된 program 객체
  loginId: currentLoginId,      // TODO: 로그인 세션/토큰에서 가져오도록 교체
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

function remainingSeats(p) {
  return p.maxParticipant - (p.reservedCount || 0);
}

function filteredPrograms() {
  const f = state.filter;
  return state.programs.filter(p =>
    (!f.region || p.region === f.region) &&
    (!f.templeId || String(p.templeId) === f.templeId) &&
    (!f.programType || p.programType === f.programType) &&
    (!f.supportEnglish || String(p.supportEnglish) === f.supportEnglish) &&
    (!f.headcount || remainingSeats(p) >= Number(f.headcount))
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

// ------------------------- STEP 전환 (1/2/3) -------------------------
function goToStep(step) {
  const sections = document.querySelectorAll('main > section[data-step]');
  const current = Array.from(sections).find(sec => !sec.hidden);
  const target = Array.from(sections).find(sec => Number(sec.dataset.step) === step);

  state.step = step;

  // Promise를 반환해서, 호출부가 "실제로 hidden이 풀린 뒤"를 기다렸다가 다음 동작(지도 로드 등)을
  // 하게 함. 예전엔 setTimeout(150ms)으로 hidden이 풀리기 전에 renderStep3()의 fetch가 먼저 끝나서
  // #result-map이 아직 안 보이는 상태로 지도가 만들어지는 문제가 있었음.
  return new Promise((resolve) => {
    const swapSections = () => {
      sections.forEach(sec => {
        sec.hidden = Number(sec.dataset.step) !== step;
      });
      document.querySelectorAll('#progress-steps li').forEach((li, i) => {
        li.classList.toggle('active', i === step - 1);
      });
      window.scrollTo(0, 0);

      if (target) {
        target.classList.add('step-fade');
        // hidden 해제 직후에 바로 opacity:1로 가면 트랜지션이 안 먹으니, 한 프레임 쉬었다가 클래스 제거
        requestAnimationFrame(() => {
          requestAnimationFrame(() => target.classList.remove('step-fade'));
        });
      }

      resolve();
    };

    if (current && current !== target) {
      current.classList.add('step-fade');
      setTimeout(swapSections, 150); // 이전 화면 페이드아웃 끝난 뒤 전환
    } else {
      swapSections();
    }
  });
}

// ------------------------- STEP 1: 목록 렌더링 -------------------------
function renderFilterOptions() {
  const regionSelect = document.getElementById('filter-region');
  const headcountSelect = document.getElementById('filter-headcount');

  // 화면에 보이는 글자만 사전(programI18n.js)으로 바꾸고 value는 한국어 원문 유지(필터 비교용).
  // 번역기가 다시 덮어쓰지 않도록 option에 .no-translate를 붙인다.
  regionSelect.innerHTML = `<option value="" class="no-translate">${trUi('all')}</option>` +
    uniqueRegions().map(r => `<option value="${r}" class="no-translate">${trRegion(r)}</option>`).join('');
  regionSelect.value = state.filter.region;

  renderTempleOptions(state.filter.region);

  // 프로그램들의 max_participant 중 가장 큰 값까지 1명 단위로 옵션 생성 (지금은 전부 20명)
  const maxOfAll = Math.max(...state.programs.map(p => p.maxParticipant));
  const headcountOptions = Array.from({ length: maxOfAll }, (_, i) => i + 1);

  headcountSelect.innerHTML = `<option value="" class="no-translate">${trUi('all')}</option>` +
    headcountOptions.map(n => `<option value="${n}" class="no-translate">${trPeople(n)}</option>`).join('');
  headcountSelect.value = state.filter.headcount;
}

// 지역 필터에 맞춰 사찰 셀렉박스 옵션만 다시 그림 (region이 빈 문자열이면 전체 사찰)
function renderTempleOptions(region) {
  const templeSelect = document.getElementById('filter-temple');
  templeSelect.innerHTML = `<option value="" class="no-translate">${trUi('all')}</option>` +
    uniqueTemples(region).map(([id, name]) => `<option value="${id}" class="no-translate">${trTempleName(name)}</option>`).join('');
  templeSelect.value = state.filter.templeId;
}

const PROGRAM_PAGE_SIZE = 9; // 3줄 x 3개

function renderProgramList() {
  const listEl = document.getElementById('program-list');
  const results = filteredPrograms();

  if (results.length === 0) {
    listEl.innerHTML = `<p class="no-translate">${trUi('noProgram')}</p>`;
    document.getElementById('program-pagination').innerHTML = '';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(results.length / PROGRAM_PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const pageStart = (state.page - 1) * PROGRAM_PAGE_SIZE;
  const pageResults = results.slice(pageStart, pageStart + PROGRAM_PAGE_SIZE);

  listEl.innerHTML = pageResults.map(p => {
    const full = remainingSeats(p) <= 0;
    return `
  <article class="program-card ${state.checkedProgramId === p.programId ? 'picked' : ''}" data-program-id="${p.programId}" data-type="${p.programType}">
    <div class="program-card-thumb"><img src="${p.imageUrl || ''}" alt="${p.title}"></div>
    <div class="program-card-body">
      <div class="program-card-top">
        <div class="badge-group">
          <span class="program-type-badge no-translate" data-type="${p.programType}">${trType(p.programType)}</span>
          ${p.supportEnglish ? '<span class="lang-badge">EN</span>' : ''}
        </div>
        <p class="program-capacity no-translate">
          <span class="capacity-dot ${full ? 'full' : 'open'}"></span>
          ${p.reservedCount || 0} / ${trPeople(p.maxParticipant)}
        </p>
      </div>
      <h3 class="program-title">${p.title}</h3>
      <p class="program-temple-region no-translate">${trTempleRegion(p.templeName, p.region)}</p>
      <div class="program-card-footer">
        <div class="program-price">
          <span class="price-adult no-translate">${trWon(p.price)}</span>
          <span class="price-note no-translate" data-pi18n="priceNote">${trUi('priceNote')}</span>
        </div>
        <a class="program-detail-btn" href="/reservation/programs/${p.programId}">상세보기</a>
      </div>
    </div>
  </article>
  `;
  }).join('');

  // 상세보기는 이제 실제 링크(<a>)라 stopPropagation만 해서 카드 클릭 선택으로 안 번지게 함
  listEl.querySelectorAll('.program-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
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
  renderPagination(totalPages);
}

const PROGRAM_PAGE_WINDOW = 10; // 페이지 번호는 한 번에 최대 10개까지만 보여주고, 그 이상은 « » 로 블록 이동

function renderPagination(totalPages) {
  const pagerEl = document.getElementById('program-pagination');

  if (totalPages <= 1) {
    pagerEl.innerHTML = '';
    return;
  }

  const blockStart = Math.floor((state.page - 1) / PROGRAM_PAGE_WINDOW) * PROGRAM_PAGE_WINDOW + 1;
  const blockEnd = Math.min(blockStart + PROGRAM_PAGE_WINDOW - 1, totalPages);

  const buttons = [];
  buttons.push(`<button type="button" data-page="${blockStart - 1}" ${blockStart === 1 ? 'disabled' : ''}>«</button>`);
  buttons.push(`<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>‹</button>`);
  for (let i = blockStart; i <= blockEnd; i++) {
    buttons.push(`<button type="button" class="${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`);
  }
  buttons.push(`<button type="button" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''}>›</button>`);
  buttons.push(`<button type="button" data-page="${blockEnd + 1}" ${blockEnd === totalPages ? 'disabled' : ''}>»</button>`);

  pagerEl.innerHTML = buttons.join('');

  pagerEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = Number(btn.dataset.page);
      renderProgramList();
      document.getElementById('program-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function updateGoToReserveButton() {
  document.getElementById('go-to-reserve-btn').disabled = !state.checkedProgramId;
}

document.getElementById('go-to-reserve-btn').addEventListener('click', () => {
  if (!state.checkedProgramId) return;
  selectProgram(state.checkedProgramId);
});

document.getElementById('step3-back-to-list-btn').addEventListener('click', () => {
  // goToStep(1)만 하면 state.programs가 방금 예약하기 전 값 그대로라 예약자수가 안 바뀐 걸로 보임 -
  // 페이지를 아예 새로 불러서 목록을 다시 조회하게 함
  location.href = '/reservation';
});

function selectProgram(programId) {
  if(!isLoggedIn) {
    alert(trUi('loginRequired'));
    // 목록에서 카드 체크 후 "신청" 버튼으로 들어온 경로는 URL에 programId가 없어서(?startBooking=
    // 파라미터 없이 그냥 /reservation) 로그인 후 돌아와도 어떤 프로그램을 고르려 했는지 알 수 없었음.
    // programDetail.js에서 들어온 경로(이미 ?startBooking= 붙어있음)와 동일하게 항상 붙여서 보냄.
    const returnUrl = '/reservation?startBooking=' + programId;
    location.href = '/login?redirect=' + encodeURIComponent(returnUrl);
    return;
  }

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
  const summaryRegionEl = summary.querySelector('.program-temple-region');
  summaryRegionEl.classList.add('no-translate');
  summaryRegionEl.textContent = trTempleRegion(p.templeName, p.region);
  const summaryPriceEl = summary.querySelector('.program-price');
  summaryPriceEl.classList.add('no-translate');
  summaryPriceEl.textContent = `${trWon(p.price)} / ${trUi('detailPerPerson')}`;

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
  renderSelectedRange();
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

  monthLabel.classList.add('no-translate');
  monthLabel.textContent = trMonthLabel(year, month);

  const firstWeekday = new Date(year, month, 1).getDay();   // 0(일)~6(토)
  const totalDays = new Date(year, month + 1, 0).getDate(); // 그 달의 마지막 날

  // 당일 예약은 막고 내일부터 선택 가능하게 함 - "오늘"이 아니라 "내일" 날짜를
  // 선택 가능한 최소 날짜로 삼는다. toDateStr은 단순 문자열 조합이라 day를 그냥 +1 하면
  // 월말(예: 1/31 -> 1/32)에 깨지므로, new Date(...)로 실제 날짜를 하루 더한 뒤(월/연도
  // 초과를 Date가 알아서 정규화함) 그 결과값으로 문자열을 만든다.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minSelectableStr = toDateStr(
    tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()
  );

  const cells = [];

  // 요일 헤더
  // 요일 머리글은 한글이 아닌 사전 값이라 .no-translate로 번역기가 다시 손대지 못하게 한다
  trWeekdays().forEach(d => {
    cells.push(`<div class="cal-dow no-translate">${d}</div>`);
  });

  // 1일이 시작하기 전까지 빈 칸
  for (let i = 0; i < firstWeekday; i++) {
    cells.push('<div class="cal-day empty"></div>');
  }

  // 실제 날짜 칸
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = toDateStr(year, month, day);
    const isPast = dateStr < minSelectableStr;
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

  renderSelectedRange();
  renderCalendar();
}

/** 달력 아래 "선택한 날짜: ..." 안내 - 아직 고르기 전이면 "날짜를 선택해 주세요." (사전 문구) */
function renderSelectedRange() {
  const rangeEl = document.getElementById('cal-selected-range');
  rangeEl.classList.add('no-translate');
  if (!state.startDate || !state.endDate) {
    rangeEl.textContent = trUi('rsvPickDate');
    return;
  }
  rangeEl.textContent = state.startDate === state.endDate
    ? `${trUi('selectedDate')} ${state.startDate} ${trUi('dayTrip')}`
    : `${trUi('selectedDate')} ${state.startDate} ~ ${state.endDate} ${trUi('overnight')}`;
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
        <label for="participant-name-${i}" class="no-translate" data-pi18n="name">${trUi('name')}</label>
        <input type="text" id="participant-name-${i}" data-p-field="name" data-p-index="${i}" value="${pt.name}">
      </div>
      <div class="form-item">
        <label for="participant-gender-${i}" class="no-translate" data-pi18n="gender">${trUi('gender')}</label>
        <select id="participant-gender-${i}" data-p-field="gender" data-p-index="${i}">
          <option value="" class="no-translate" data-pi18n="genderSelect" ${pt.gender === '' ? 'selected' : ''}>${trUi('genderSelect')}</option>
          <option value="남성" class="no-translate" data-pi18n="male" ${pt.gender === '남성' ? 'selected' : ''}>${trUi('male')}</option>
          <option value="여성" class="no-translate" data-pi18n="female" ${pt.gender === '여성' ? 'selected' : ''}>${trUi('female')}</option>
        </select>
      </div>
      <div class="form-item">
        <label for="participant-email-${i}" class="no-translate" data-pi18n="email">${trUi('email')}</label>
        <input type="email" id="participant-email-${i}" data-p-field="email" data-p-index="${i}" value="${pt.email}" data-pi18n-placeholder="emailPh" placeholder="${trUi('emailPh')}">
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
  const totalEl = document.getElementById('payment-total-amount');
  totalEl.classList.add('no-translate');
  totalEl.textContent =
    `${trWon(p.price)} x ${trPeople(state.participantCount)} = ${trWon(total)}`;
}

function togglePaymentFields() {
  document.querySelectorAll('.payment-field').forEach(field => {
    field.hidden = field.dataset.method !== state.paymentMethod;
  });
}

// ------------------------- STEP 2 이벤트 바인딩 -------------------------
// (시작일/종료일은 이제 달력 클릭으로 정해짐 - selectStartDate() 참고. 이 두 input은 hidden이라 change 리스너 불필요)

document.getElementById('res-participant-count').addEventListener('change', (e) => {
  state.participantCount = Math.max(1, Number(e.target.value) || 1);
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
  if (state.isSubmitting) {
    alert(trUi('alertPaying'));
    return; // 서버 응답 오기 전에 또 눌러도 무시 (중복 신청 방지)
  }

  const p = state.selectedProgram;

  // 최소한의 유효성 검사
  if (!state.startDate || !state.endDate) {
    alert(trUi('alertPickStart'));
    return;
  }
  if (state.participants.some(pt => !pt.name || !pt.gender || !pt.email)) {
    alert(trUi('alertFillAll'));
    return;
  }
  if (!state.participants[0] || !state.participants[0].phone) {
    alert(trUi('alertRepPhone'));
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
  };

  const totalAmount = p.price * state.participantCount;
  const dateLabel = trDateRange(state.startDate, state.endDate);

  // 확인창은 브라우저 대화상자라 번역기가 못 건드림 - 지금 언어의 사전 문구로 직접 만든다
  const confirmMessage =
  `${trUi('confirmTitle')}\n\n` +
  `${trUi('cProgram')}: ${p.title}\n` +
  `${trUi('cTemple')}: ${trTempleName(p.templeName)} (${trRegion(p.region)})\n` +
  `${trUi('cPeriod')}: ${dateLabel}\n` +
  `${trUi('cHeadcount')}: ${trPeople(state.participantCount)}\n` +
  `${trUi('cPayMethod')}: ${trPayMethod(state.paymentMethod)}` +
  (state.paymentMethod === '계좌이체' ? `\n${trUi('cDepositor')}: ${state.depositorName || trUi('cNotEntered')}` : '') +
  `\n${trUi('cTotal')}: ${trWon(totalAmount)}`;

  const ok = confirm(confirmMessage);
  if (!ok) return;

  state.isSubmitting = true;
  setSubmitLoading(true);
  // 예약/참가자/결제 생성 + (계좌이체는) 결제확인 화면 데이터 조회까지 전부 여기 안에서
  // 순차로 왕복하므로, 그 사이 화면이 멈춰 보이지 않게 전체를 로딩 오버레이로 감싼다.
  showLoading(trUi('loadingReserve'));
  try {
    const resRes = await fetch(API.createReservation, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(reservationPayload),
    });
    if (!resRes.ok) {
      // 정원 초과처럼 신청 시점에 이미 자리가 없어진 경우 - 서버가 내려준 메시지 그대로 보여줌
      const err = await resRes.json().catch(() => null);
      alert(err && err.message ? i18nSrv(err.message) : trUi('failReserve'));
      return;
    }
    const reservation = await resRes.json();

    const participantPayload = state.participants.map(pt => ({
    reservationId: reservation.reservationId,
    name: pt.name,
    gender: pt.gender,
    email: pt.email,
    phone: pt.phone || null,   // 대표자(participants[0])만 실제 값 있고 나머지는 폼에 입력칸이 없어서 빈 값
    }));
    const partRes = await fetch(API.createParticipants,{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(participantPayload),
    });
    if (!partRes.ok) {
      const err = await partRes.json().catch(() => null);
      alert(err && err.message ? i18nSrv(err.message) : trUi('failParticipants'));
      return;
    }
    if (state.paymentMethod === '카카오페이') {
      // 페이지를 완전히 떠났다 돌아오므로(카카오 결제창 리다이렉트) state가 사라짐 - 돌아왔을 때는
      // resumeAfterKakaoPay()가 서버에서 예약을 다시 조회하고, 프로그램 정보는 state.programs(항상
      // init에서 먼저 불러옴)에서 다시 찾으므로 여기서 따로 남겨둘 값 없음.
      const readyRes = await fetch('/payments/kakao/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.reservationId,
          amount: totalAmount,
          itemName: p.title,
        }),
      });
      if (!readyRes.ok) {
        const err = await readyRes.json().catch(() => null);
        alert(err && err.message ? i18nSrv(err.message) : trUi('failKakaoReady'));
        return;
      }
      const { redirectUrl } = await readyRes.json();
      location.href = redirectUrl; // 카카오페이 결제창으로 이동 - 이후 흐름은 payments/kakao/approve 콜백에서 이어짐
      return;
    }

    // PAYMENT 생성 요청 (계좌이체 - 무통장입금이라 즉시결제 없이 바로 완료 처리)
    const paymentPayload = {
      reservationId: reservation.reservationId,
      paymentMethod: state.paymentMethod,
      amount: totalAmount,
      depositorName: state.depositorName,
      kakaoTid: null,
    };

    const payRes = await fetch(API.createPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(paymentPayload),
    });
    if (!payRes.ok) {
      const err = await payRes.json().catch(() => null);
      alert(err && err.message ? i18nSrv(err.message) : trUi('failPayment'));
      return;
    }
    const payment = await payRes.json();

    // 방금 만든 예약은 신청일시(created_at)가 DB가 채워주는 값이라 응답에 아직 안 실려있음 -
    // 다시 조회해서 실제 신청일시가 담긴 예약 정보로 바꿔치기함.
    const freshReservation = await fetch(`/templestayreservations/${reservation.reservationId}`).then(r => r.json());

    state.reservationResult = { reservation: freshReservation, payment, program: p };
    await goToStep(3);      // 지도 컨테이너가 hidden 상태에서 생성되면 크기가 0으로 잡혀 마커 위치가 어긋나므로 먼저 보이게 함
    await renderStep3();
  } catch (err) {
    alert(trUi('failGeneric'));
    console.error(err);
  } finally {
    // 성공 시엔 카카오페이면 페이지를 완전히 떠나고, 계좌이체면 step3로 넘어가서 이 버튼 자체가
    // 안 보이니 굳이 안 풀어도 되지만, 실패로 여기 되돌아오는 모든 경로를 한 곳에서 확실히 풀기 위해 finally에 둠.
    state.isSubmitting = false;
    setSubmitLoading(false);
    hideLoading();
  }
}

// 신청 버튼에 원형 스피너 표시/해제 - 서버 응답 오기 전 중복 클릭 방지용
function setSubmitLoading(loading) {
  const btn = document.getElementById('step2-submit-btn');
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> ' + trUi('processing');
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || trUi('submitBtn');
  }
}

// ------------------------- STEP 3: 신청 완료 -------------------------
async function renderStep3() {
  console.log('renderStep3 호출됨, state.reservationResult =', state.reservationResult);
    const { reservation, payment } = state.reservationResult;
    // 프로그램 정보는 항상 state.programs(init에서 이미 불러온 전체 목록)에서 찾음 - 카카오페이
    // 결제창을 왕복하고 왔을 때도 loadPrograms()가 먼저 끝난 뒤라 안전하게 찾을 수 있음.
    const program = state.programs.find(p => p.programId === reservation.programId) || state.reservationResult.program || {};
    console.log('renderStep3에서 찾은 program =', program);

  // 인원정보는 항상 서버에서 다시 조회함 - 카카오페이 결제창 왕복 후에는 state.participants가
  // 비어있어서(페이지를 완전히 떠났다 옴) in-memory 값을 믿을 수 없음.
  let participants = [];
  try {
    const res = await fetch(`/reservationparticipants/reservation/${reservation.reservationId}`);
    if (res.ok) participants = await res.json();
  } catch (err) {
    console.error('참가자 정보를 불러오지 못했습니다.', err);
  }

  const resultIdEl = document.getElementById('result-reservation-id');
  resultIdEl.classList.add('no-translate');
  resultIdEl.textContent = `${trUi('reservationNo')} ${reservation.reservationId}`;
  document.getElementById('result-applied-at').textContent = formatAppliedAt(reservation.createdAt);
  document.getElementById('result-program-title').textContent = program.title || '';
  const resultTempleEl = document.getElementById('result-temple-name');
  resultTempleEl.classList.add('no-translate');
  resultTempleEl.textContent = trTempleRegion(program.templeName || '', program.region || '');
  const resultDateEl = document.getElementById('result-date-range');
  resultDateEl.classList.add('no-translate');
  resultDateEl.textContent = trDateRange(reservation.startDate, reservation.endDate);
  const resultCountEl = document.getElementById('result-participant-count');
  resultCountEl.classList.add('no-translate');
  resultCountEl.textContent = trPeople(reservation.participantCount);
  document.getElementById('result-participant-list').innerHTML = participants.length
    ? participants.map(pt => `<tr><td class="no-translate">${pt.name}</td><td class="no-translate">${trGender(pt.gender)}</td><td class="no-translate">${pt.email}</td><td class="no-translate">${pt.phone || '-'}</td></tr>`).join('')
    : `<tr><td colspan="4" class="no-translate">${trUi('noParticipantInfo')}</td></tr>`;
  const resultAmountEl = document.getElementById('result-total-amount');
  resultAmountEl.classList.add('no-translate');
  resultAmountEl.textContent = trWon(payment.amount);
  const resultMethodEl = document.getElementById('result-payment-method');
  resultMethodEl.classList.add('no-translate');
  resultMethodEl.textContent = trPayMethod(payment.paymentMethod);
  const resultStatusEl = document.getElementById('result-status');
  resultStatusEl.classList.add('no-translate');
  resultStatusEl.textContent = trStatus(reservation.status);

  if (program.programId != null) loadResultMap(program);
}

// 신청 완료 화면의 위치 지도. #result-map 컨테이너용 상태는 여기서 따로 들고 있고,
// 실제 생성/갱신 로직은 mapCommon.js의 loadTempleDetailMap을 공유해서 씀.
var _resultMapState = { map: null, marker: null };
function loadResultMap(program) {
  loadTempleDetailMap('result-map', program, _resultMapState);
}

document.getElementById('go-to-my-reservations-btn').addEventListener('click', () => {
  // TODO: 마이페이지/내 예약 목록 페이지로 이동
     location.href = '/mypage/myReservations';
});

// ------------------------- 필터 -------------------------
// 검색 버튼 없이, 셀렉박스를 바꾸는 즉시 필터가 적용되도록 함.
// 처음 로드될 때는 모든 필터가 빈 값이라 전체 프로그램이 다 보임.
function bindFilterChangeEvents() {
  document.getElementById('filter-region').addEventListener('change', (e) => {
    state.filter.region = e.target.value;
    // 지역이 바뀌면 이전에 골라둔 사찰이 그 지역과 안 맞을 수 있으니 초기화하고 옵션도 다시 그림
    state.filter.templeId = '';
    state.page = 1;
    renderTempleOptions(state.filter.region);
    renderProgramList();
  });
  document.getElementById('filter-temple').addEventListener('change', (e) => {
    state.filter.templeId = e.target.value;
    state.page = 1;
    renderProgramList();
  });
  document.getElementById('filter-program-type').addEventListener('change', (e) => {
    state.filter.programType = e.target.value;
    state.page = 1;
    renderProgramList();
  });
  document.getElementById('filter-support-english').addEventListener('change', (e) => {
    state.filter.supportEnglish = e.target.value;
    state.page = 1;
    renderProgramList();
  });
  document.getElementById('filter-headcount').addEventListener('change', (e) => {
    state.filter.headcount = e.target.value;
    state.page = 1;
    renderProgramList();
  });
}

// 서버에서 사찰 목록 + 프로그램 목록을 받아와서 하나로 합쳐줌
async function loadPrograms() {
  showLoading('프로그램 목록을 불러오는 중...');
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
            // 사찰의 위경도 - 프로그램 DTO엔 없고 temple 쪽에만 있어서 여기서 같이 합쳐줘야
            // loadResultMap/loadTempleDetailMap이 지도를 그릴 수 있음.
            latitude: temple ? temple.latitude : null,
            longitude: temple ? temple.longitude : null,
          };
        });
  } catch (err) {
    console.error('프로그램 목록을 불러오는 데 실패했습니다.', err);
    alert(i18nMsg('errLoadPrograms'));
    // 실패하면 state.programs는 원래 MOCK_PROGRAMS 그대로 유지됨
  } finally {
    hideLoading();
  }
}

// 언어가 바뀌면 common.js가 번역기 적용 후 불러줌 - 필터 옵션/카드를 지금 언어 사전으로 다시 그림.
// 선택값은 state.filter에 한국어 원문으로 들어있어서 그대로 복원된다.
window.onProgramI18nRefresh = function () {
  if (!document.getElementById('filter-region')) return;
  renderFilterOptions();
  renderProgramList();

  // step 2: 예약 신청 화면이 열려 있으면 요약/달력/참가자 행/결제 총액도 새 언어로
  // (달력 클릭 선택값과 입력값은 state에 있으므로 그대로 유지된다)
  if (state.step === 2 && state.selectedProgram) {
    const p = state.selectedProgram;
    const summary = document.getElementById('selected-program-summary');
    const regionEl = summary.querySelector('.program-temple-region');
    regionEl.classList.add('no-translate');
    regionEl.textContent = trTempleRegion(p.templeName, p.region);
    const priceEl = summary.querySelector('.program-price');
    priceEl.classList.add('no-translate');
    priceEl.textContent = `${trWon(p.price)} / ${trUi('detailPerPerson')}`;
    renderSelectedRange();
    renderCalendar();
    renderParticipantRows();
    updatePaymentTotal();
  }
  // step 3: 신청 완료 화면의 값들(날짜, 인원, 결제수단, 예약 상태 등)도 새 언어로
  if (state.step === 3 && state.reservationResult) {
    renderStep3();
  }
};

// ------------------------- 초기화 -------------------------
async function init() {
  await loadPrograms();

  renderFilterOptions();
  bindFilterChangeEvents();
  renderProgramList();
  goToStep(1);

  await resumeAfterKakaoPay();

  // 프로그램 상세보기 페이지(programDetail.js)의 "예약 신청" 버튼으로 들어온 경우
  // (?startBooking=X) 목록 단계 건너뛰고 바로 예약 신청(step2)으로 이동.
  // 비로그인 상태면 selectProgram이 /login?redirect=이 URL 그대로 보내야 하므로,
  // 로그인 안 된 상태에서는 쿼리스트링을 미리 지우지 않는다(로그인 후 이 파라미터로 다시 돌아와서 이어짐).
  const startBookingId = new URLSearchParams(location.search).get('startBooking');
  if (startBookingId) {
    if (isLoggedIn) history.replaceState({}, '', location.pathname);
    selectProgram(Number(startBookingId));
  }
}

// 카카오페이 결제창으로 갔다가 돌아왔을 때(?paid=success|cancel|fail&reservationId=..) 이어서 처리.
// 결제 도중엔 페이지를 완전히 떠나서 state가 비어있으므로, 서버에서 예약/결제를 다시 조회해서 그림.
async function resumeAfterKakaoPay() {
  const params = new URLSearchParams(location.search);
  const paid = params.get('paid');
  const reservationId = params.get('reservationId');
  if (!paid || !reservationId) return;

  history.replaceState({}, '', location.pathname); // 새로고침해도 다시 안 뜨게 쿼리스트링 지움

  if (paid === 'cancel') {
    alert(trUi('payCanceled'));
    return;
  }
  if (paid === 'fail') {
    alert(trUi('payFailed'));
    return;
  }
  if (paid !== 'success') return;

  showLoading('결제 결과를 확인하는 중...');
  try {
    const [reservation, payment] = await Promise.all([
      fetch(`/templestayreservations/${reservationId}`).then(r => r.json()),
      fetch(`/payments/reservation/${reservationId}`).then(r => r.json()),
    ]);
    state.reservationResult = { reservation, payment, program: {} }; // renderStep3가 state.programs에서 다시 찾음
    await goToStep(3);
    await renderStep3();
  } catch (err) {
    console.error(err);
    alert(trUi('payDoneNoResult'));
  } finally {
    hideLoading();
  }
}

// common.js(showLoading/hideLoading 등)가 defer로 로드되는데, 이 파일은 defer 없이 body
// 맨 아래서 바로 실행돼서 파싱 순서상 이 스크립트가 먼저 돌아버릴 수 있다 - DOMContentLoaded는
// 모든 defer 스크립트 실행이 끝난 뒤에 발생이 보장되므로 그 안에서 init()을 불러야 안전하다.
document.addEventListener('DOMContentLoaded', init);