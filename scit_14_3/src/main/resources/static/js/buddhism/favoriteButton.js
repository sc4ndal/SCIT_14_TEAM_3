/* ============================================================
   favoriteButton.js — 즐겨찾기 토글 공용 스크립트
   ------------------------------------------------------------
   .favorite-toggle 버튼이라면 어디서든(오늘의 한마디/사찰음식/마이페이지
   즐겨찾기 목록) 이 스크립트 하나로 동작한다. 버튼에 아래 data 속성이 있어야 함:
     data-favorite-url   : POST로 토글을 요청할 주소 (예: /info/quote/3/favorite)
     data-favorited      : 현재 즐겨찾기 상태("true"/"false") - 최초 렌더 시 서버가 채워줌

   로그인 여부는 reservation.js 등 다른 페이지와 동일하게 #auth-info(존재 여부)로 판단한다.
   마이페이지 즐겨찾기 목록 화면에서는 해제 시 카드 자체를 지우기 위해, 카드 요소에
   data-remove-on-unfavorite 속성을 붙여두면 즐겨찾기 해제 순간 그 카드를 DOM에서 제거한다.

   해제(이미 즐겨찾기된 상태에서 다시 누르는 경우)는 myReservation.js의 예약 취소와
   동일하게 confirm()으로 한 번 더 확인한 뒤에만 요청을 보낸다. 등록할 때는 되돌리기
   쉬우니 확인창 없이 바로 처리한다.
   ============================================================ */

function applyFavoriteState(btn, favorited) {
	btn.dataset.favorited = String(favorited);
	btn.classList.toggle('is-favorited', favorited);
	btn.setAttribute('aria-pressed', String(favorited));
	var label = btn.querySelector('.favorite-toggle__label');
	if (label) {
		label.textContent = favorited ? '즐겨찾기됨' : '즐겨찾기';
	}
}

document.addEventListener('click', function (e) {
	var btn = e.target.closest('.favorite-toggle');
	if (!btn) return;

	var isLoggedIn = !!document.getElementById('auth-info');
	if (!isLoggedIn) {
		alert('로그인이 필요합니다.');
		location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
		return;
	}

	var url = btn.dataset.favoriteUrl;
	if (!url) return;

	var isCurrentlyFavorited = btn.dataset.favorited === 'true';
	if (isCurrentlyFavorited && !confirm('즐겨찾기를 해제하시겠습니까?')) {
		return;
	}

	btn.disabled = true;
	fetch(url, { method: 'POST' })
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
			// 한마디/음식은 {favorited}, 사찰 즐겨찾기(/api/favoritetemples)는 {favorite}로 내려줘서 둘 다 받음
			var favorited = data.favorited !== undefined ? data.favorited : data.favorite;
			applyFavoriteState(btn, favorited);

			if (!favorited) {
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
