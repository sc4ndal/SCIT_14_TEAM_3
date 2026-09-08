// ------------------------- 로그인 확인 -------------------------
const authInfo = document.getElementById('auth-info');
const isLoggedIn = !!authInfo;
const currentLoginId = authInfo ? authInfo.dataset.loginId : null;

if (!isLoggedIn) {
  alert('로그인이 필요합니다.');
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
  try {
    // 리뷰 자체엔 프로그램/사찰 이름이 없어서, 예약목록(myReservation.js)과 같은 방식으로
    // 예약/사찰/프로그램을 같이 불러와 리뷰에 붙여준다.
    const [reviewsRes, reservationsRes, templesRes, programsRes] = await Promise.all([
      fetch(`/reviews?loginId=${currentLoginId}`),
      fetch(`/templestayreservations?loginId=${currentLoginId}`),
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

      const title = program ? program.title : '(정보 없음)';
      const templeName = temple ? temple.name : '';
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
            <h3>${escapeHtml(title)}</h3>
            <span class="review-item-rating">${stars}</span>
          </div>
          <p class="review-item-meta">${escapeHtml(templeName)} · ${dateText}</p>
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
    alert('리뷰 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

async function deleteReview(reviewId) {
  const ok = confirm('이 리뷰를 삭제하시겠습니까?');
  if (!ok) return;

  try {
    const res = await fetch(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err && err.message ? err.message : '리뷰 삭제 중 오류가 발생했습니다.');
      return;
    }
    alert('리뷰가 삭제되었습니다.');
    loadMyReviews();
  } catch (err) {
    console.error('리뷰 삭제 중 오류가 발생했습니다.', err);
    alert('리뷰 삭제 중 오류가 발생했습니다.');
  }
}

loadMyReviews();
