/* ============================================================
   quote.js — /info/quote 전용
   "다른 한마디 보기" 버튼을 누르면 페이지 로드 시 이미 받아둔 ALL_QUOTES(quote.html의
   인라인 스크립트, 전체 한마디 목록) 안에서 랜덤으로 골라 화면만 바꾼다 - 서버 왕복 없음.
   즐겨찾기 토글 자체는 favoriteButton.js가 공용으로 처리한다.
   ============================================================ */

document.getElementById('quote-refresh-btn')?.addEventListener('click', function () {
	if (!Array.isArray(ALL_QUOTES) || ALL_QUOTES.length === 0) return;

	// 즐겨찾기 버튼은 USER에게만 렌더링되므로, 현재 한마디 ID는 항상 있는 #quote-content에서 읽는다
	var contentEl = document.getElementById('quote-content');
	var currentId = Number(contentEl.dataset.quoteId);
	var candidates = ALL_QUOTES.length > 1
		? ALL_QUOTES.filter(function (q) { return q.quoteId !== currentId; })
		: ALL_QUOTES;
	var quote = candidates[Math.floor(Math.random() * candidates.length)];

	contentEl.textContent = quote.content;
	contentEl.dataset.quoteId = quote.quoteId;

	var sourceEl = document.getElementById('quote-source');
	if (quote.source) {
		sourceEl.textContent = quote.source;
		sourceEl.hidden = false;
	} else {
		sourceEl.hidden = true;
	}

	var favoriteBtn = document.getElementById('quote-favorite-btn');
	if (!favoriteBtn) return;
	favoriteBtn.dataset.favoriteUrl = '/info/quote/' + quote.quoteId + '/favorite';
	applyFavoriteState(favoriteBtn, quote.favorited);
});
