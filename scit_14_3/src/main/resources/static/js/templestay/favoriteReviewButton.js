/* ============================================================
   favoriteReviewButton.js — 마이페이지 "좋아요한 리뷰" 좋아요 취소 버튼 전용
   ------------------------------------------------------------
   리뷰 좋아요 토글(/reviews/{id}/like)은 {liked} 키로 응답해서
   {favorited}/{favorite} 키를 쓰는 buddhism/favoriteButton.js와는 별도로 둔다
   (reviews.js의 전체 후기 목록 좋아요 버튼과 동일한 컨벤션).

   .like-toggle 버튼에 data-review-id가 있어야 하며, 취소 시 카드를 지우려면
   카드 요소에 data-remove-on-unfavorite를 붙인다.

   해제(좋아요 취소)는 buddhism/favoriteButton.js와 동일하게 confirm()으로 한 번 더
   확인한 뒤에만 요청을 보낸다.
   ============================================================ */

document.addEventListener('click', function (e) {
	var btn = e.target.closest('.like-toggle');
	if (!btn) return;

	var reviewId = btn.dataset.reviewId;
	if (!reviewId) return;

	if (!confirm('좋아요를 취소하시겠습니까?')) {
		return;
	}

	btn.disabled = true;
	fetch('/reviews/' + reviewId + '/like', { method: 'POST' })
		.then(function (res) {
			if (res.status === 401) {
				alert('로그인이 필요합니다.');
				location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
				return null;
			}
			if (!res.ok) {
				throw new Error('요청 처리 중 오류가 발생했습니다.');
			}
			return res.json();
		})
		.then(function (data) {
			if (!data) return;
			if (!data.liked) {
				var card = btn.closest('[data-remove-on-unfavorite]');
				if (card) card.remove();
			}
		})
		.catch(function (err) {
			alert(err.message || '요청 처리 중 오류가 발생했습니다.');
		})
		.finally(function () {
			btn.disabled = false;
		});
});
