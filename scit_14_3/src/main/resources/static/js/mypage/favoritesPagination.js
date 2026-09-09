/* ============================================================
   favoritesPagination.js — 마이페이지 즐겨찾기 카드 그리드 공용 페이지네이션
   ------------------------------------------------------------
   저장한 한마디(/mypage/favorites/quotes), 관심 사찰음식(/mypage/favorites/foods)
   등 서버가 즐겨찾기 카드를 전부 렌더링해두는 화면에서, 한 페이지에
   PAGE_SIZE(6)장씩만 보이도록 화면에서 나눠 보여준다.

   대상 그리드는 data-favorites-grid="<페이지네이션 엘리먼트 id>" 속성을 붙이면 된다.
   카드는 그리드의 직계 자식(article) 기준으로 센다.

   favoriteButton.js가 즐겨찾기 해제 시 카드를 DOM에서 바로 지우기 때문에
   (data-remove-on-unfavorite), 그 변화를 MutationObserver로 감지해서
   페이지를 다시 계산한다 - 마지막 장의 카드가 전부 사라지면 이전 페이지로 돌아간다.
   ============================================================ */

(function () {
	var PAGE_SIZE = 6;

	document.querySelectorAll('[data-favorites-grid]').forEach(function (grid) {
		var pagerEl = document.getElementById(grid.dataset.favoritesGrid);
		if (!pagerEl) return;

		var currentPage = 1;

		function renderPage(page) {
			var cards = Array.prototype.slice.call(grid.children);
			var totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
			currentPage = Math.min(Math.max(page, 1), totalPages);

			var start = (currentPage - 1) * PAGE_SIZE;
			var end = start + PAGE_SIZE;
			cards.forEach(function (card, i) {
				card.hidden = i < start || i >= end;
			});

			renderPagination(totalPages);
		}

		function renderPagination(totalPages) {
			if (totalPages <= 1) {
				pagerEl.innerHTML = '';
				return;
			}

			var buttons = [];
			buttons.push('<button type="button" data-page="' + (currentPage - 1) + '" ' +
				(currentPage === 1 ? 'disabled' : '') + '>‹</button>');
			for (var i = 1; i <= totalPages; i++) {
				buttons.push('<button type="button" class="' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>');
			}
			buttons.push('<button type="button" data-page="' + (currentPage + 1) + '" ' +
				(currentPage === totalPages ? 'disabled' : '') + '>›</button>');

			pagerEl.innerHTML = buttons.join('');
			pagerEl.querySelectorAll('button').forEach(function (btn) {
				btn.addEventListener('click', function () {
					renderPage(Number(btn.dataset.page));
				});
			});
		}

		renderPage(1);

		new MutationObserver(function () {
			renderPage(currentPage);
		}).observe(grid, { childList: true });
	});
})();
