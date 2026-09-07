/* ============================================================
   quote.js — /info/quote 전용
   "다른 한마디 보기" 버튼을 누르면 GET /info/quote/random으로 무작위 한마디를
   받아와서 카드 내용과 즐겨찾기 버튼을 새 한마디 기준으로 다시 그린다.
   즐겨찾기 토글 자체는 favoriteButton.js가 공용으로 처리한다.
   ============================================================ */

document.getElementById('quote-refresh-btn')?.addEventListener('click', function (btnEvent) {
	var btn = btnEvent.currentTarget;
	btn.disabled = true;

	fetch('/info/quote/random')
		.then(function (res) {
			if (!res.ok) throw new Error('한마디를 불러오지 못했습니다.');
			return res.json();
		})
		.then(function (quote) {
			document.getElementById('quote-content').textContent = quote.content;

			var sourceEl = document.getElementById('quote-source');
			if (quote.source) {
				sourceEl.textContent = quote.source;
				sourceEl.hidden = false;
			} else {
				sourceEl.hidden = true;
			}

			var favoriteBtn = document.getElementById('quote-favorite-btn');
			favoriteBtn.dataset.favoriteUrl = '/info/quote/' + quote.quoteId + '/favorite';
			applyFavoriteState(favoriteBtn, quote.favorited);
		})
		.catch(function (err) {
			alert(err.message || '한마디를 불러오지 못했습니다.');
		})
		.finally(function () {
			btn.disabled = false;
		});
});
