/* ============================================================
   quote.js — /info/quote 전용
   "다른 한마디 보기" 버튼을 누르면 페이지 로드 시 이미 받아둔 ALL_QUOTES(quote.html의
   인라인 스크립트, 전체 한마디 목록) 안에서 랜덤으로 골라 화면만 바꾼다 - 서버 왕복 없음.
   즐겨찾기 토글 자체는 favoriteButton.js가 공용으로 처리한다.
   ============================================================ */

document.getElementById('quote-refresh-btn')?.addEventListener('click', function () {
	if (!Array.isArray(ALL_QUOTES) || ALL_QUOTES.length === 0) return;

	var currentId = Number(document.getElementById('quote-favorite-btn').dataset.favoriteUrl.split('/')[3]);
	var candidates = ALL_QUOTES.length > 1
		? ALL_QUOTES.filter(function (q) { return q.quoteId !== currentId; })
		: ALL_QUOTES;
	var quote = candidates[Math.floor(Math.random() * candidates.length)];

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
});
