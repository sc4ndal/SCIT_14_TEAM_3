// 템플스테이 전체 후기 모아보기 (/reservation/reviews).
// 프로그램 상세페이지에 임베드되는 리뷰와 달리, 여기서는 전 사찰의 후기를 한 곳에 모아
// 검색 / 정렬 / 10개 단위 페이징으로 보여준다.
//
// GET /reviews/all (ReviewController.getAllReviews)에서 전체 후기를 받아온다. 응답 형태:
// [{ reviewId, templeName, programName, title, rating, authorName, createdAt, content, imageUrls }]
// 혹시 모를 API 실패에도 페이지가 안 깨지도록 fetchAllReviews()에서 빈 배열로 처리한다.

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

// 관리자 계정 + 사찰 계정은 좋아요를 못 쓰게 서버(ReviewController.toggleLike)에서 막아뒀다 -
// 관리자는 #admin-info 존재 여부로, 사찰 계정은 #auth-info의 data-temple-account로 판별해서
// 둘 다 좋아요 버튼 대신 읽기 전용 개수만 보여준다.
const isAdmin = !!document.getElementById('admin-info');
const isTempleAccount = document.getElementById('auth-info')?.dataset.templeAccount === 'true';
const cannotLike = isAdmin || isTempleAccount;

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

async function fetchAllReviews() {
  showLoading(trUi('revLoading'));
  try {
    const res = await fetch('/reviews/all', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[reviews] 전체 후기 목록을 불러오지 못했습니다.', e);
    alert(trUi('revErrLoad'));
    return [];
  } finally {
    hideLoading();
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
    // 고정 문구라 사전(programI18n.js)으로 그린다. data-pi18n은 언어가 바뀔 때 다시 채우는 용도.
    const emptyKey = state.query ? 'revNoResult' : 'revNoReviews';
    listEl.innerHTML = `<div class="review-empty no-translate" data-pi18n="${emptyKey}">${trUi(emptyKey)}</div>`;
    // 아코디언 펼치기/정렬/검색마다 목록을 통째로 다시 그려서, 번역해둔 언어라면 그 순간
    // 원문(한국어)이 화면에 잠깐 보였다가 번역으로 바뀌는 게 눈에 띄었다 - MutationObserver의
    // 디바운스를 기다리지 않고 그린 직후 바로 재번역을 건다(common.js).
    window.i18nRetranslateNow && window.i18nRetranslateNow();
    return;
  }

  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = state.filtered.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = pageRows.map(renderItem).join('');
  window.i18nRetranslateNow && window.i18nRetranslateNow();

  // 아코디언 펼치기/접기 - renderList()로 목록 전체를 다시 그리면 번역이 그때마다 새로 돌아서
  // 외국어에서 깜빡였다. 접힘/펼침 내용은 이미 다 그려져 있으니 .open 클래스만 바꾼다(CSS가 전환).
  listEl.querySelectorAll('.review-summary').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.review-item');
      const id = item.dataset.id;
      const willOpen = String(state.openId) !== String(id);
      // 한 번에 하나만 펼친다 - 이미 열려 있던 다른 항목은 닫는다
      listEl.querySelectorAll('.review-item.open').forEach((el) => el.classList.remove('open'));
      state.openId = willOpen ? id : null;
      item.classList.toggle('open', willOpen);
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

  // 좋아요 토글 - review-summary(아코디언 펼치기 버튼)와 별개 버튼이라 클릭이 겹치지 않는다.
  // 관리자 계정용 읽기 전용 좋아요 수(.like-btn--readonly)는 <span>이라 여기 안 걸린다.
  listEl.querySelectorAll('button.like-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLike(btn.dataset.reviewId);
    });
  });
}

async function toggleLike(reviewId) {
  if (!currentLoginId) {
    alert(trUi('loginRequired'));
    location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
    return;
  }
  try {
    const res = await fetch(`/reviews/${reviewId}/like`, { method: 'POST' });
    if (res.status === 401) {
      alert(trUi('loginRequired'));
      location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
      return;
    }
    if (!res.ok) {
      // 서버가 상황별 메시지(예: 관리자 계정 차단)를 JSON body의 message로 내려주므로
      // 그대로 살려서 보여준다 - 파싱 자체가 실패하면(예상 밖 응답) 기존 문구로 대체.
      const body = await res.json().catch(() => null);
      throw new Error((body && body.message) || '좋아요 처리 중 오류가 발생했습니다.');
    }
    const data = await res.json();

    const review = state.all.find((r) => String(r.reviewId) === String(reviewId));
    if (review) {
      review.liked = data.liked;
      review.likeCount = Math.max(0, (review.likeCount || 0) + (data.liked ? 1 : -1));
    }
    renderList();
  } catch (e) {
    console.error('좋아요 처리 중 오류가 발생했습니다.', e);
    alert(e.message ? i18nSrv(e.message) : trUi('revErrLike'));
  }
}

async function deleteReview(reviewId) {
  if (!confirm(trUi('revConfirmDelete'))) return;
  showLoading(trUi('revDeleting'));
  try {
    const res = await fetch(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err && err.message ? i18nSrv(err.message) : trUi('revErrDelete'));
      return;
    }
    alert(trUi('revDeleted'));
    // 서버를 다시 부르지 않고 로컬 목록에서 제거 후 재렌더
    state.all = state.all.filter((r) => String(r.reviewId) !== String(reviewId));
    if (String(state.openId) === String(reviewId)) state.openId = null;
    applyFilters();
  } catch (e) {
    console.error('리뷰 삭제 중 오류가 발생했습니다.', e);
    alert(trUi('revErrDelete'));
  } finally {
    hideLoading();
  }
}

function renderItem(r) {
  const id = r.reviewId ?? '';
  const isOpen = String(state.openId) === String(id);
  // 접힘 = 요약(제목 또는 내용 미리보기 + 메타줄), 펼침 = 상세박스가 같은 정보를 이미 다 보여주므로
  // 헤더는 제목만 남기고 미리보기/메타줄은 감춰서 중복을 없앤다(제목이 없는 리뷰는 절 이름으로 대체).
  // 접힘/펼침 두 가지 제목을 둘 다 그려두고 CSS(.open)로 보이는 쪽만 고른다(위 아코디언 주석 참고)
  const headingOpen = r.title || r.templeName || trUi('revNoTitle');
  const headingClosed = r.title || r.content || trUi('revNoContent');
  const templeName = r.templeName ? escapeHtml(r.templeName) : '';
  const programName = r.programName ? escapeHtml(r.programName) : '';
  const authorName = r.authorName ? escapeHtml(r.authorName) : '';
  // 사찰명 사전(templeI18n.js)에 있으면 번역기가 덮어쓰지 못하게 .no-translate를 붙인다
  function templeDictClass(name) { return trTempleName(name) !== name ? ' no-translate' : ''; }
  // 닉네임은 번역 금지(.no-translate), 서버가 탈퇴 회원에게 붙이는 고정 문구는 사전 번역 대상
  const authorClass = r.authorName === '탈퇴한 회원' ? '' : 'no-translate';
  // 절/프로그램명/별점 - 작성자/일시 두 줄로 나눠 보여준다.
  const metaLine1 = [
    r.templeName ? `<span class="temple${templeDictClass(r.templeName)}" data-pi18n-temple="${escapeAttr(r.templeName)}">${escapeHtml(trTempleName(r.templeName))}</span>` : '',
    r.programName ? `<span class="prog">${escapeHtml(r.programName)}</span>` : '',
    `<span class="stars no-translate">${stars(r.rating)}</span>`,
  ].filter(Boolean).join('');
  const metaLine2 = [
    r.authorName ? `<span class="${authorClass}">${escapeHtml(r.authorName)}</span>` : '',
    `<span>${formatDate(r.createdAt)}</span>`,
  ].filter(Boolean).join('');
  const meta = `<span class="meta-line">${metaLine1}</span><span class="meta-line">${metaLine2}</span>`;

  // 본인이 쓴 리뷰면 수정/삭제 버튼 노출 (수정은 reservationId 기준으로 진입 - reviewWrite.js가 그걸로 로드).
  // 실제 권한은 서버(PATCH·DELETE /reviews/{id})가 다시 검증한다.
  const isMine = currentLoginId && r.loginId && r.loginId === currentLoginId && r.reservationId != null;
  const actions = isMine
    ? `<div class="review-actions">
         <a class="edit-link no-translate" data-pi18n="revEdit" href="/mypage/reviews/write?reservationId=${encodeURIComponent(r.reservationId)}&reviewId=${encodeURIComponent(r.reviewId)}">${trUi('revEdit')}</a>
         <button type="button" class="delete-btn no-translate" data-pi18n="revDelete" data-review-id="${escapeAttr(r.reviewId)}">${trUi('revDelete')}</button>
       </div>`
    : '';

  // 목록에는 축소본(cloudinaryThumb)을 쓰고, 원본 URL은 data-full에 넣어 라이트박스에서 사용한다.
  const images = Array.isArray(r.imageUrls) && r.imageUrls.length
    ? `<div class="review-images">${r.imageUrls
        .map((u) => `<img src="${escapeAttr(cloudinaryThumb(u))}" data-full="${escapeAttr(u)}" alt="후기 사진" loading="lazy">`)
        .join('')}</div>`
    : '';

  const likeCount = Number(r.likeCount) || 0;
  const liked = !!r.liked;

  return `
    <div class="review-item${isOpen ? ' open' : ''}" data-id="${escapeAttr(id)}">
      <div class="review-row">
        <button type="button" class="review-summary">
          <span class="col-main">
            <span class="review-title title-closed">${escapeHtml(headingClosed)}</span>
            <span class="review-title title-open">${escapeHtml(headingOpen)}</span>
            <span class="review-meta">${meta}</span>
          </span>
          <span class="chevron">
            <span class="chevron-label label-closed no-translate" data-pi18n="revMore">${trUi('revMore')}</span>
            <span class="chevron-label label-open no-translate" data-pi18n="revCollapse">${trUi('revCollapse')}</span>
            <span class="chevron-icon">&#9660;</span>
          </span>
        </button>
        ${cannotLike
          ? `<span class="like-btn like-btn--readonly" aria-label="좋아요 ${likeCount}개">
              <span class="like-btn__icon"></span><span class="like-btn__count">${likeCount}</span>
            </span>`
          : `<button type="button" class="like-btn${liked ? ' is-liked' : ''}"
                data-review-id="${escapeAttr(id)}" aria-pressed="${liked}">
          <span class="like-btn__icon"></span><span class="like-btn__count">${likeCount}</span>
        </button>`}
      </div>
      <div class="review-detail">
        <dl class="detail-fields">
          <dt class="no-translate" data-pi18n="revTempleName">${trUi('revTempleName')}</dt><dd>${
            templeName
              ? (r.templeId != null
                  ? `<a class="field-link${templeDictClass(r.templeName)}" data-pi18n-temple="${escapeAttr(r.templeName)}" href="/temple-detail/${encodeURIComponent(r.templeId)}">${escapeHtml(trTempleName(r.templeName))}</a>`
                  : `<span class="${templeDictClass(r.templeName).trim()}" data-pi18n-temple="${escapeAttr(r.templeName)}">${escapeHtml(trTempleName(r.templeName))}</span>`)
              : '-'
          }</dd>
          <dt class="no-translate" data-pi18n="programName">${trUi('programName')}</dt><dd>${
            programName
              ? (r.programId != null
                  ? `<a class="field-link" href="/reservation/programs/${encodeURIComponent(r.programId)}">${programName}</a>`
                  : programName)
              : '-'
          }</dd>
          <dt class="no-translate" data-pi18n="revRating">${trUi('revRating')}</dt><dd><span class="stars no-translate">${stars(r.rating)}</span></dd>
          <dt class="no-translate" data-pi18n="revAuthor">${trUi('revAuthor')}</dt><dd>${
            authorName
              ? `<button type="button" class="author-filter ${authorClass}" data-author="${escapeAttr(r.authorName)}">${authorName}</button>`
              : '-'
          }</dd>
          <dt class="no-translate" data-pi18n="revDate">${trUi('revDate')}</dt><dd>${formatDate(r.createdAt)}</dd>
          <dt class="no-translate" data-pi18n="revContent">${trUi('revContent')}</dt><dd class="content-cell">${escapeHtml(r.content || '')}</dd>
        </dl>
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
