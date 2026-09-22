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

/* 클릭 시 라벨을 이 파일이 직접 다시 그리는데, 항상 한국어로 박아 넣으면 이미
   번역해둔 언어가 원상복구돼버림 - common.js의 전역 사전(I18N_MANUAL_OVERRIDES)과
   현재 언어(i18nCurrentLang)를 그대로 참조해서 지금 보고 있는 언어를 유지한다. */
function favoriteLabelText(korean) {
	var lang = (typeof i18nCurrentLang !== 'undefined') ? i18nCurrentLang : 'ko';
	if (lang !== 'ko' && typeof I18N_MANUAL_OVERRIDES !== 'undefined') {
		var override = I18N_MANUAL_OVERRIDES[korean] && I18N_MANUAL_OVERRIDES[korean][lang];
		if (override) return override;
	}
	return korean;
}

function applyFavoriteState(btn, favorited) {
	btn.dataset.favorited = String(favorited);
	btn.classList.toggle('is-favorited', favorited);
	btn.setAttribute('aria-pressed', String(favorited));
	var label = btn.querySelector('.favorite-toggle__label');
	if (label) {
		label.textContent = favoriteLabelText(favorited ? '즐겨찾기됨' : '즐겨찾기');
	}
}

document.addEventListener('click', function (e) {
	var btn = e.target.closest('.favorite-toggle');
	if (!btn) return;

	var isLoggedIn = !!document.getElementById('auth-info');
	if (!isLoggedIn) {
		alert(i18nMsg('loginRequired'));
		location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
		return;
	}

	var url = btn.dataset.favoriteUrl;
	if (!url) return;

	var isCurrentlyFavorited = btn.dataset.favorited === 'true';
	if (isCurrentlyFavorited && !confirm(i18nMsg('confirmUnfavorite'))) {
		return;
	}

	btn.disabled = true;
	fetch(url, { method: 'POST' })
		.then(function (res) {
			if (res.status === 401) {
				alert(i18nMsg('loginRequired'));
				location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
				return null;
			}
			if (!res.ok) {
				// 서버가 상황별 메시지(예: 관리자 계정 차단)를 JSON body의 message로 내려주므로
				// 그대로 살려서 보여준다 - 파싱 자체가 실패하면(예상 밖 응답) 기존 문구로 대체.
				return res.json().catch(function () { return {}; }).then(function (body) {
					throw new Error((body && body.message) || '요청 처리 중 오류가 발생했습니다.');
				});
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
			alert(i18nSrv(err.message) || i18nMsg('errRequest'));
		})
		.finally(function () {
			btn.disabled = false;
		});
});

/* 언어를 바꿀 때 라벨을 현재 언어로 다시 맞춘다.
   클릭할 때 applyFavoriteState가 라벨을 새 텍스트로 갈아끼우면 그 텍스트는 common.js의 번역 목록(최초
   스냅샷)에 없어서, 이후 언어를 바꿔도 갱신되지 않고 예전 언어(예: 일본어)가 그대로 남았다. 버튼의
   data-favorited 상태를 기준으로 언제든 다시 그리게 해서 그 문제를 없앤다. common.js가 번역을 다 적용한
   뒤(i18nAfterApplyHooks)에 실행되고, 한국어로 되돌릴 때도 실행돼서 원문 복원도 여기서 처리한다. */
function refreshFavoriteLabels() {
	document.querySelectorAll('.favorite-toggle').forEach(function (btn) {
		if (btn.dataset.favorited === undefined) return; // 좋아요 버튼 등 즐겨찾기 상태가 없는 버튼은 제외
		var label = btn.querySelector('.favorite-toggle__label');
		if (!label) return;
		label.classList.add('no-translate');
		label.textContent = favoriteLabelText(btn.dataset.favorited === 'true' ? '즐겨찾기됨' : '즐겨찾기');
	});
}
window.i18nAfterApplyHooks = window.i18nAfterApplyHooks || [];
window.i18nAfterApplyHooks.push(refreshFavoriteLabels);
