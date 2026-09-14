// 템플스테이 전체 후기 모아보기 (/reservation/reviews).
// 프로그램 상세페이지에 임베드되는 리뷰와 달리, 여기서는 전 사찰의 후기를 한 곳에 모아
// 검색 / 정렬 / 10개 단위 페이징으로 보여준다.
//
// 목록 조회 API는 아직 없다 - GET /reviews/all 을 기대하고 호출하되, 실패하면 빈 목록으로
// 처리해서 페이지가 깨지지 않게 한다. API가 붙으면 fetchAllReviews() 안만 손보면 된다.
// 기대하는 응답: [{ reviewId, templeName, programName, title, rating, authorName, createdAt, content, imageUrls }]

const PAGE_SIZE = 10;

const state = {
  all: [],       // 서버에서 받은 전체 후기
  filtered: [],  // 검색 + 정렬 적용된 목록
  page: 1,
  sort: 'latest',
  query: '',
  openId: null,  // 현재 펼쳐진 후기 (한 번에 하나만)
};

const listEl = document.getElementById('review-list');
const pagerEl = document.getElementById('review-pagination');
const sortEl = document.getElementById('review-sort');
const searchEl = document.getElementById('review-search');
const searchBtnEl = document.getElementById('review-search-btn');

// 로그인한 사용자의 login_id (#auth-info는 비로그인이면 sec:authorize로 아예 렌더 안 됨).
// 본인이 쓴 리뷰에만 "수정하기" 링크를 노출하는 용도 - 실제 수정 권한은 서버(PATCH /reviews/{id})가 검증한다.
const currentLoginId = document.getElementById('auth-info')?.dataset.loginId || null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  sortEl.addEventListener('change', () => {
    state.sort = sortEl.value;
    state.page = 1;
    applyFilters();
  });
  searchBtnEl.addEventListener('click', runSearch);
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });

  // 후기 사진 클릭 -> 라이트박스로 크게 보기. 목록은 renderList()가 통째로 다시 그리므로
  // 안 갈리는 컨테이너(listEl)에 이벤트 위임으로 한 번만 건다.
  listEl.addEventListener('click', (e) => {
    const img = e.target.closest('.review-images img');
    if (!img) return;
    const imgs = [...img.closest('.review-images').querySelectorAll('img')];
    const items = imgs.map((el) => el.dataset.full || el.src);
    openLightbox(items, imgs.indexOf(img));
  });

  state.all = await fetchAllReviews();
  applyFilters();
}

function runSearch() {
  state.query = searchEl.value.trim().toLowerCase();
  state.page = 1;
  applyFilters();
}

// TODO: 전체 후기 목록 조회 API가 나오면 이 함수만 연결하면 된다.
async function fetchAllReviews() {
  try {
    const res = await fetch('/reviews/all', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.info('[reviews] 전체 후기 목록 API가 아직 없어 빈 페이지로 표시합니다.', e);
    return [];
  }
}

function applyFilters() {
  const q = state.query;
  let rows = state.all.slice();

  if (q) {
    rows = rows.filter((r) => {
      const haystack = [
        r.templeName, r.programName, r.authorName, r.content,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  rows.sort((a, b) => {
    if (state.sort === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (state.sort === 'rating-asc') return (a.rating || 0) - (b.rating || 0);
    if (state.sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // latest
  });

  state.filtered = rows;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;

  renderList();
  renderPager(totalPages);
}

function renderList() {
  if (state.filtered.length === 0) {
    listEl.innerHTML = `<div class="review-empty">${
      state.query ? '검색 결과가 없습니다.' : '등록된 후기가 없습니다.'
    }</div>`;
    return;
  }

  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = state.filtered.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = pageRows.map(renderItem).join('');

  listEl.querySelectorAll('.review-summary').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.review-item').dataset.id;
      state.openId = String(state.openId) === String(id) ? null : id;
      renderList();
    });
  });

  // 작성자 클릭 -> 아래 검색창에 작성자명을 넣고 검색 실행(= 이 작성자 리뷰만 표시)
  listEl.querySelectorAll('.author-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const author = btn.dataset.author || '';
      searchEl.value = author;
      state.query = author.trim().toLowerCase();
      state.page = 1;
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 본인 리뷰 삭제 (마이페이지 '내가 쓴 리뷰'와 동일한 흐름)
  listEl.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteReview(btn.dataset.reviewId));
  });
}

async function deleteReview(reviewId) {
  if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
  try {
    const res = await fetch(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err && err.message ? err.message : '리뷰 삭제 중 오류가 발생했습니다.');
      return;
    }
    alert('리뷰가 삭제되었습니다.');
    // 서버를 다시 부르지 않고 로컬 목록에서 제거 후 재렌더
    state.all = state.all.filter((r) => String(r.reviewId) !== String(reviewId));
    if (String(state.openId) === String(reviewId)) state.openId = null;
    applyFilters();
  } catch (e) {
    console.error('리뷰 삭제 중 오류가 발생했습니다.', e);
    alert('리뷰 삭제 중 오류가 발생했습니다.');
  }
}

function renderItem(r) {
  const id = r.reviewId ?? '';
  const isOpen = String(state.openId) === String(id);
  // 리뷰엔 별도 제목이 없어 프로그램명을 제목 자리에 쓴다(마이페이지 '내가 쓴 리뷰'와 동일).
  const heading = r.programName || '(프로그램 정보 없음)';
  const templeName = r.templeName ? escapeHtml(r.templeName) : '';
  const programName = r.programName ? escapeHtml(r.programName) : '';
  const authorName = r.authorName ? escapeHtml(r.authorName) : '';
  const meta = [
    r.templeName ? `<span class="temple">${escapeHtml(r.templeName)}</span>` : '',
    `<span class="stars">${stars(r.rating)}</span>`,
    r.authorName ? `<span>${escapeHtml(r.authorName)}</span>` : '',
    `<span>${formatDate(r.createdAt)}</span>`,
  ].filter(Boolean).join('');

  // 본인이 쓴 리뷰면 수정/삭제 버튼 노출 (수정은 reservationId 기준으로 진입 - reviewWrite.js가 그걸로 로드).
  // 실제 권한은 서버(PATCH·DELETE /reviews/{id})가 다시 검증한다.
  const isMine = currentLoginId && r.loginId && r.loginId === currentLoginId && r.reservationId != null;
  const actions = isMine
    ? `<div class="review-actions">
         <a class="edit-link" href="/mypage/reviews/write?reservationId=${encodeURIComponent(r.reservationId)}&reviewId=${encodeURIComponent(r.reviewId)}">수정하기</a>
         <button type="button" class="delete-btn" data-review-id="${escapeAttr(r.reviewId)}">삭제하기</button>
       </div>`
    : '';

  // 목록에는 축소본(cloudinaryThumb)을 쓰고, 원본 URL은 data-full에 넣어 라이트박스에서 사용한다.
  const images = Array.isArray(r.imageUrls) && r.imageUrls.length
    ? `<div class="review-images">${r.imageUrls
        .map((u) => `<img src="${escapeAttr(cloudinaryThumb(u))}" data-full="${escapeAttr(u)}" alt="후기 사진" loading="lazy">`)
        .join('')}</div>`
    : '';

  return `
    <div class="review-item${isOpen ? ' open' : ''}" data-id="${escapeAttr(id)}">
      <button type="button" class="review-summary">
        <span class="col-main">
          <span class="review-title">${escapeHtml(heading)}</span>
          <span class="review-meta">${meta}</span>
        </span>
        <span class="chevron">&#9660;</span>
      </button>
      <div class="review-detail">
        <dl class="detail-fields">
          <dt>사찰명</dt><dd>${
            templeName
              ? (r.templeId != null
                  ? `<a class="field-link" href="/temple-detail/${encodeURIComponent(r.templeId)}">${templeName}</a>`
                  : templeName)
              : '-'
          }</dd>
          <dt>프로그램명</dt><dd>${
            programName
              ? (r.programId != null
                  ? `<a class="field-link" href="/reservation/programs/${encodeURIComponent(r.programId)}">${programName}</a>`
                  : programName)
              : '-'
          }</dd>
          <dt>별점</dt><dd><span class="stars">${stars(r.rating)}</span></dd>
          <dt>작성자</dt><dd>${
            authorName
              ? `<button type="button" class="author-filter" data-author="${escapeAttr(r.authorName)}">${authorName}</button>`
              : '-'
          }</dd>
          <dt>작성일</dt><dd>${formatDate(r.createdAt)}</dd>
        </dl>
        <div class="review-content">${escapeHtml(r.content || '')}</div>
        ${images}
        ${actions}
      </div>
    </div>`;
}

function renderPager(totalPages) {
  if (state.filtered.length === 0 || totalPages <= 1) {
    pagerEl.innerHTML = '';
    return;
  }

  const cur = state.page;
  const btns = [];
  btns.push(`<button type="button" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>&lt;</button>`);
  for (let p = 1; p <= totalPages; p++) {
    btns.push(`<button type="button" class="${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`);
  }
  btns.push(`<button type="button" data-page="${cur + 1}" ${cur === totalPages ? 'disabled' : ''}>&gt;</button>`);

  pagerEl.innerHTML = btns.join('');
  pagerEl.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = Number(btn.dataset.page);
      if (!p || p === state.page || btn.disabled) return;
      state.page = p;
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ---- 이미지 라이트박스 ------------------------------------------------------
// 오버레이 DOM은 한 번만 만들어 재사용한다. 여러 장이면 ← / → (또는 좌우 화살표 키)로 넘긴다.
const lightbox = {
  el: null, imgEl: null, counterEl: null, prevBtn: null, nextBtn: null,
  items: [], index: 0, lastFocus: null,
};

function ensureLightbox() {
  if (lightbox.el) return;
  const el = document.createElement('div');
  el.className = 'image-lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', '후기 사진 크게 보기');
  el.innerHTML = `
    <button type="button" class="lb-close" aria-label="닫기">&times;</button>
    <button type="button" class="lb-nav lb-prev" aria-label="이전 사진">&#8249;</button>
    <img class="lb-img" alt="후기 사진">
    <button type="button" class="lb-nav lb-next" aria-label="다음 사진">&#8250;</button>
    <div class="lb-counter" aria-hidden="true"></div>`;
  document.body.appendChild(el);

  lightbox.el = el;
  lightbox.imgEl = el.querySelector('.lb-img');
  lightbox.counterEl = el.querySelector('.lb-counter');
  lightbox.prevBtn = el.querySelector('.lb-prev');
  lightbox.nextBtn = el.querySelector('.lb-next');

  el.addEventListener('click', (e) => {
    // 사진 / 화살표가 아닌 배경을 누르면 닫는다
    if (e.target === el || e.target.classList.contains('lb-close')) closeLightbox();
  });
  lightbox.prevBtn.addEventListener('click', () => stepLightbox(-1));
  lightbox.nextBtn.addEventListener('click', () => stepLightbox(1));
}

function openLightbox(items, index) {
  if (!items.length) return;
  ensureLightbox();
  lightbox.items = items;
  lightbox.index = Math.max(0, index);
  lightbox.lastFocus = document.activeElement;
  lightbox.el.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderLightbox();
  lightbox.el.querySelector('.lb-close').focus();
}

function renderLightbox() {
  const { items, index } = lightbox;
  lightbox.imgEl.src = items[index];
  const multi = items.length > 1;
  lightbox.prevBtn.hidden = !multi;
  lightbox.nextBtn.hidden = !multi;
  lightbox.prevBtn.disabled = index === 0;
  lightbox.nextBtn.disabled = index === items.length - 1;
  lightbox.counterEl.hidden = !multi;
  lightbox.counterEl.textContent = multi ? `${index + 1} / ${items.length}` : '';
}

function stepLightbox(delta) {
  const next = lightbox.index + delta;
  if (next < 0 || next >= lightbox.items.length) return;
  lightbox.index = next;
  renderLightbox();
}

function closeLightbox() {
  if (!lightbox.el || !lightbox.el.classList.contains('open')) return;
  lightbox.el.classList.remove('open');
  document.body.style.overflow = '';
  lightbox.imgEl.removeAttribute('src');
  if (lightbox.lastFocus) lightbox.lastFocus.focus();
}

document.addEventListener('keydown', (e) => {
  if (!lightbox.el || !lightbox.el.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
  else if (e.key === 'ArrowRight') stepLightbox(1);
});

// Cloudinary 업로드 URL이면 목록용 축소본 변형을 끼워넣는다(원본은 data-full로 따로 보관).
// 그 외 형태의 URL은 그대로 반환한다.
function cloudinaryThumb(url) {
  const marker = '/image/upload/';
  const i = String(url).indexOf(marker);
  if (i === -1) return url;
  const head = url.slice(0, i + marker.length);
  const tail = url.slice(i + marker.length);
  return `${head}c_fill,w_240,h_240,q_auto,f_auto/${tail}`;
}

function stars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

// 후기 본문 / 사찰명 등은 사용자가 입력한 값이라 innerHTML에 넣기 전 반드시 이스케이프한다.
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function escapeAttr(text) {
  return String(text == null ? '' : text).replace(/"/g, '&quot;');
}
