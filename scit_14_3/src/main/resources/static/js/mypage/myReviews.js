// ------------------------- 로그인 확인 -------------------------
const authInfo = document.getElementById('auth-info');
const isLoggedIn = !!authInfo;

if (!isLoggedIn) {
  alert(i18nMsg('loginRequired'));
  location.href = '/login';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '';
  return isoString.slice(0, 10); // "2026-09-08T12:34:56" -> "2026-09-08"
}

async function loadMyReviews() {
  showLoading('리뷰 목록을 불러오는 중...');
  try {
    // 리뷰 자체엔 프로그램/사찰 이름이 없어서, 예약목록(myReservation.js)과 같은 방식으로
    // 예약/사찰/프로그램을 같이 불러와 리뷰에 붙여준다.
    const [reviewsRes, reservationsRes, templesRes, programsRes] = await Promise.all([
      fetch('/reviews'),
      fetch('/templestayreservations'),
      fetch('/temples'),
      fetch('/templestayprograms'),
    ]);

    const reviews = await reviewsRes.json();
    const reservations = await reservationsRes.json();
    const temples = await templesRes.json();
    const programs = await programsRes.json();

    const reservationMap = new Map(reservations.map(r => [r.reservationId, r]));
    const templeMap = new Map(temples.map(t => [t.templeId, t]));
    const programMap = new Map(programs.map(p => [p.programId, p]));

    const listEl = document.getElementById('review-list');
    document.getElementById('review-count-label').textContent = reviews.length;

    if (reviews.length === 0) {
      listEl.innerHTML = '<p class="empty-msg">아직 작성한 리뷰가 없습니다.</p>';
      return;
    }

    listEl.innerHTML = reviews.map(review => {
      const reservation = reservationMap.get(review.reservationId);
      const program = reservation ? programMap.get(reservation.programId) : null;
      const temple = program ? templeMap.get(program.templeId) : null;

      const programTitle = program ? program.title : '(정보 없음)';
      // 리뷰 자체 제목이 있으면 그걸 헤더로 쓰고, 없는(예전) 리뷰는 기존처럼 프로그램명으로 대체한다.
      const reviewTitle = review.title || programTitle;
      const templeName = temple ? temple.name : '';
      // 절 이름/프로그램명을 누르면 각 상세 페이지로 이동 (templestay/reviews.js와 동일한 경로 규칙)
      const templeLink = temple
        ? `<a class="meta-link" href="/temple-detail/${encodeURIComponent(temple.templeId)}">${escapeHtml(templeName)}</a>`
        : (templeName ? escapeHtml(templeName) : '-');
      const programLink = program
        ? `<a class="meta-link" href="/reservation/programs/${encodeURIComponent(program.programId)}">${escapeHtml(programTitle)}</a>`
        : escapeHtml(programTitle);
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const images = (review.imageUrls || []).map(url =>
        `<img src="${url}" alt="리뷰 첨부 이미지">`
      ).join('');

      // 수정한 적 있는 리뷰만 작성일 옆에 수정일을 같이 보여줌 (작성 직후엔 두 값이 동일)
      let dateText = `작성일 ${formatDate(review.createdAt)}`;
      if (review.updatedAt && review.updatedAt !== review.createdAt) {
        dateText += ` · 수정일 ${formatDate(review.updatedAt)}`;
      }

      return `
        <article class="review-item-card" data-review-id="${review.reviewId}">
          <div class="review-item-header">
            <h3>${escapeHtml(reviewTitle)}</h3>
            <span class="review-item-rating">${stars}</span>
          </div>
          <p class="review-item-meta">${templeLink} · ${programLink}</p>
          <p class="review-item-meta review-item-meta--date">${dateText}</p>
          <p class="review-item-content">${escapeHtml(review.content)}</p>
          ${images ? `<div class="review-item-images">${images}</div>` : ''}
          <div class="review-item-actions">
            <a class="review-item-edit-btn"
               href="/mypage/reviews/write?reservationId=${review.reservationId}&reviewId=${review.reviewId}">수정</a>
            <button class="review-item-delete-btn" type="button" data-review-id="${review.reviewId}">삭제</button>
          </div>
        </article>
      `;
    }).join('');

    listEl.querySelectorAll('.review-item-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteReview(btn.dataset.reviewId));
    });
  } catch (err) {
    console.error('내가 쓴 리뷰를 불러오지 못했습니다.', err);
    alert(i18nMsg('errLoadReviewList'));
  } finally {
    hideLoading();
  }
}

async function deleteReview(reviewId) {
  const ok = confirm(i18nMsg('confirmDeleteReview'));
  if (!ok) return;

  try {
    const res = await fetch(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err && err.message ? i18nSrv(err.message) : i18nMsg('errDeleteReview'));
      return;
    }
    alert(i18nMsg('reviewDeleted'));
    loadMyReviews();
  } catch (err) {
    console.error('리뷰 삭제 중 오류가 발생했습니다.', err);
    alert(i18nMsg('errDeleteReview'));
  }
}

loadMyReviews();
