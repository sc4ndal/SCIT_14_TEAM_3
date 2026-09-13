// ------------------------- 로그인 확인 -------------------------
const authInfo = document.getElementById('auth-info');
const isLoggedIn = !!authInfo;
const currentLoginId = authInfo ? authInfo.dataset.loginId : null;

if (!isLoggedIn) {
  alert('로그인이 필요합니다.');
  location.replace('/login');
}

// ------------------------- URL 파라미터 -------------------------
const params = new URLSearchParams(location.search);
const reservationId = Number(params.get('reservationId'));
const editingReviewId = params.get('reviewId'); // 있으면 수정 모드 (myReviews.js / myReservation.js에서 넘겨줌)
const isEditMode = !!editingReviewId;

if (!reservationId) {
  alert('잘못된 접근입니다.');
  location.replace('/mypage/myReservations');
}

// ------------------------- 사진 첨부 (작성/수정 공통) -------------------------
// 무료 Cloudinary 플랜 상한(장당 10MB) + 한 요청에 여러 장 올릴 때의 요청 전체 크기 제한
// (application.properties의 spring.servlet.multipart.max-request-size)에 맞춘 값.
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

let existingImageUrls = []; // 수정 모드에서 "유지 중인" 기존 사진 URL (삭제하면 여기서 빠짐)
let selectedFiles = [];     // 새로 추가한 파일 (작성/수정 공통)

function totalImageCount() {
  return existingImageUrls.length + selectedFiles.length;
}

function renderImagePreviews() {
  const listEl = document.getElementById('image-preview-list');

  const existingHtml = existingImageUrls.map((url, index) => `
    <div class="image-preview-item">
      <img src="${url}" alt="첨부된 이미지">
      <button type="button" data-type="existing" data-index="${index}" title="삭제">×</button>
    </div>
  `).join('');

  const newHtml = selectedFiles.map((file, index) => `
    <div class="image-preview-item">
      <img src="${URL.createObjectURL(file)}" alt="첨부 이미지 미리보기">
      <button type="button" data-type="new" data-index="${index}" title="삭제">×</button>
    </div>
  `).join('');

  listEl.innerHTML = existingHtml + newHtml;

  listEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      if (btn.dataset.type === 'existing') {
        existingImageUrls.splice(index, 1);
      } else {
        selectedFiles.splice(index, 1);
      }
      renderImagePreviews();
    });
  });
}

document.getElementById('review-images').addEventListener('change', (e) => {
  const newFiles = Array.from(e.target.files);
  e.target.value = ''; // 같은 파일을 삭제 후 다시 선택할 수 있도록 매번 초기화

  for (const file of newFiles) {
    if (totalImageCount() >= MAX_IMAGES) {
      alert(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      break;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert(`"${file.name}" 파일이 10MB를 넘어 첨부할 수 없습니다. (무료 Cloudinary 플랜 제한)`);
      continue;
    }
    selectedFiles.push(file);
  }

  renderImagePreviews();
});

// ------------------------- 별점 선택 -------------------------
let selectedRating = 0;

function renderStars() {
  document.querySelectorAll('#rating-stars button').forEach(btn => {
    btn.classList.toggle('filled', Number(btn.dataset.value) <= selectedRating);
  });
}

document.querySelectorAll('#rating-stars button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = Number(btn.dataset.value);
    renderStars();
  });
});

// ------------------------- 예약/프로그램 정보 로드 -------------------------
async function init() {
  try {
    const resRes = await fetch(`/templestayreservations/${reservationId}`);
    if (!resRes.ok) throw new Error('예약 정보를 불러오지 못했습니다.');
    const reservation = await resRes.json();

    // 본인 예약이 아니거나 이용완료 상태가 아니면 작성/수정 불가 - 서버(ReviewController)도 동일하게
    // 검증하지만 여기서 먼저 걸러서 불필요한 폼 입력을 막는다.
    if (reservation.loginId !== currentLoginId) {
      alert('본인의 예약에만 리뷰를 작성할 수 있습니다.');
      location.replace('/mypage/myReservations');
      return;
    }
    if (reservation.status !== '이용완료') {
      alert('이용이 완료된 예약만 리뷰를 작성할 수 있습니다.');
      location.replace('/mypage/myReservations');
      return;
    }

    // 예약 1건당 리뷰 1개 - 작성 모드인데 이미 리뷰가 있으면 중복 작성을 막고,
    // 수정 모드인데 리뷰가 없으면(URL 조작 등) 목록으로 돌려보낸다.
    const existingRes = await fetch(`/reviews/reservation/${reservationId}`);
    const existingReview = existingRes.ok ? await existingRes.json() : null;

    if (!isEditMode && existingReview) {
      alert('이미 이 예약에 대한 리뷰를 작성했습니다.');
      location.replace('/mypage/myReservations');
      return;
    }
    if (isEditMode && !existingReview) {
      alert('수정할 리뷰를 찾을 수 없습니다.');
      location.replace('/mypage/myReservations');
      return;
    }

    const program = await fetch(`/templestayprograms/${reservation.programId}`).then(r => r.json());
    const temple = await fetch(`/temples/${program.templeId}`).then(r => r.json());

    document.getElementById('review-program-title').textContent = program.title;
    document.getElementById('review-program-meta').textContent =
      `${temple.name} · ${reservation.startDate}` +
      (reservation.startDate !== reservation.endDate ? ` ~ ${reservation.endDate}` : '');

    if (isEditMode) {
      document.getElementById('page-heading').textContent = '리뷰 수정';
      document.title = '리뷰 수정 · 佛선자';
      document.getElementById('review-submit-btn').textContent = '수정';

      // 삭제 버튼 노출 + [수정][삭제][취소] 순으로 재배치
      document.getElementById('review-delete-btn').hidden = false;
      const actionsEl = document.querySelector('.review-actions');
      actionsEl.append(
        document.getElementById('review-submit-btn'),
        document.getElementById('review-delete-btn'),
        actionsEl.querySelector('.review-back-btn'),
      );

      selectedRating = existingReview.rating;
      renderStars();
      document.getElementById('review-content').value = existingReview.content;

      existingImageUrls = existingReview.imageUrls ? [...existingReview.imageUrls] : [];
      renderImagePreviews();
    }
  } catch (err) {
    console.error('리뷰 작성 페이지 초기화 중 오류가 발생했습니다.', err);
    alert('예약 정보를 불러오는 중 오류가 발생했습니다.');
    location.replace('/mypage/myReservations');
  }
}

// ------------------------- 리뷰 등록/수정 -------------------------
document.getElementById('review-submit-btn').addEventListener('click', async () => {
  if (selectedRating < 1) {
    alert('평점을 선택해주세요.');
    return;
  }
  const content = document.getElementById('review-content').value.trim();
  if (!content) {
    alert('리뷰 내용을 입력해주세요.');
    return;
  }

  const submitBtn = document.getElementById('review-submit-btn');
  submitBtn.disabled = true;

  try {
    // 사진 업로드는 다른 등록 폼들과 동일하게 /api/images/upload로 먼저 올리고, 받은 URL만
    // 리뷰 저장 요청에 실어 보낸다(ImageUploadController 참고 - 업로드 로직을 여기서 중복 구현하지 않음).
    const newlyUploadedUrls = [];
    for (const file of selectedFiles) {
      newlyUploadedUrls.push(await uploadImage(file));
    }
    const imageUrls = [...existingImageUrls, ...newlyUploadedUrls];

    let res;
    if (isEditMode) {
      res = await fetch(`/reviews/${editingReviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, content, imageUrls }),
      });
    } else {
      res = await fetch('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, rating: selectedRating, content, imageUrls }),
      });
    }

    if (!res.ok) {
      // 이용완료 아닌 예약, 이미 작성한 리뷰 등 서버가 이유를 알려준 경우 그 메시지 그대로 보여줌
      const err = await res.json().catch(() => null);
      alert(err && err.message ? err.message : '리뷰 저장 중 오류가 발생했습니다.');
      submitBtn.disabled = false;
      return;
    }

    alert(isEditMode ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.');
    location.replace('/mypage/myReservations');
  } catch (err) {
    console.error(err);
    alert('리뷰 저장 중 오류가 발생했습니다.');
    submitBtn.disabled = false;
  }
});

// ------------------------- 리뷰 삭제 (수정 모드 전용) -------------------------
document.getElementById('review-delete-btn').addEventListener('click', async () => {
  if (!isEditMode) return;
  if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;

  const deleteBtn = document.getElementById('review-delete-btn');
  deleteBtn.disabled = true;
  try {
    const res = await fetch(`/reviews/${editingReviewId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err && err.message ? err.message : '리뷰 삭제 중 오류가 발생했습니다.');
      deleteBtn.disabled = false;
      return;
    }
    alert('리뷰가 삭제되었습니다.');
    location.replace('/mypage/myReservations');
  } catch (err) {
    console.error('리뷰 삭제 중 오류가 발생했습니다.', err);
    alert('리뷰 삭제 중 오류가 발생했습니다.');
    deleteBtn.disabled = false;
  }
});

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    throw new Error(`이미지 업로드 실패: ${file.name}`);
  }
  const data = await res.json();
  return data.url;
}

init();
