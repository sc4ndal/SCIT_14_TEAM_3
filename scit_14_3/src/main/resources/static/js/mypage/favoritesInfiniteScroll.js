/* ============================================================
   favoritesInfiniteScroll.js — 마이페이지 즐겨찾기 카드 그리드 무한 스크롤
   ------------------------------------------------------------
   관심 행사/저장한 한마디/관심 사찰음식처럼 서버가 즐겨찾기 카드를 전부
   렌더링해두는 화면에서, 처음엔 PAGE_SIZE(12)장만 보여주고 화면을 아래로
   스크롤하면 PAGE_SIZE씩 더 드러내는 방식이다(같은 계열 화면 중 번호를
   눌러 넘기는 favoritesPagination.js와는 다른 컴포넌트).

   대상 그리드는 data-favorites-infinite-grid="<감시용 엘리먼트 id>" 속성을
   붙이면 된다. 카드는 그리드의 직계 자식(article) 기준으로 센다.

   favoriteButton.js가 즐겨찾기 해제 시 카드를 DOM에서 바로 지우기 때문에
   (data-remove-on-unfavorite), 그 변화를 MutationObserver로 감지해서
   숨김 상태를 다시 계산한다.

   다음 묶음은 바로 보여주지 않고 LOAD_DELAY_MS만큼 스피너를 보여준 뒤 카드를
   살짝 페이드인시킨다(favorites-card--enter, favorites.css) - 카드가 전부
   이미 서버에서 내려와 있어 보여주기만 하면 되는 구조라, 지연 없이 그냥
   보여주면 "로딩됐다"는 느낌이 전혀 안 든다.

   검색(선택): data-favorites-search-input="<검색창 id>"를 그리드에 추가하면
   /events 공개 페이지(events.js)와 같은 방식으로 검색이 붙는다 - 카드에는
   data-search-name 속성으로 검색 대상 문자열을 달아둔다. 검색 중엔 배치 제한을
   무시하고 매칭되는 카드를 전부 보여주고("더 불러오기" 없이), 검색어를 지우면
   원래 배치 상태로 복구된다. data-favorites-search-empty="<빈 결과 메시지 id>"는
   선택 - 있으면 매칭 결과가 없을 때 보여준다. 이 속성이 없는 그리드(저장한
   한마디/관심 사찰음식/관심 사찰)는 검색 관련 코드가 전부 조용히 건너뛰어진다.
   ============================================================ */

(function () {
	var PAGE_SIZE = 12;
	var LOAD_DELAY_MS = 300;

	document.querySelectorAll('[data-favorites-infinite-grid]').forEach(function (grid) {
		var sentinel = document.getElementById(grid.dataset.favoritesInfiniteGrid);
		if (!sentinel) return;

		var spinner = document.createElement('div');
		spinner.className = 'favorites-loading-spinner';
		spinner.setAttribute('aria-hidden', 'true');
		sentinel.insertAdjacentElement('afterend', spinner);

		var searchInput = grid.dataset.favoritesSearchInput
			? document.getElementById(grid.dataset.favoritesSearchInput) : null;
		var searchEmpty = grid.dataset.favoritesSearchEmpty
			? document.getElementById(grid.dataset.favoritesSearchEmpty) : null;

		var visibleCount = PAGE_SIZE;
		var loading = false;
		var searching = false;

		function render() {
			Array.prototype.forEach.call(grid.children, function (card, i) {
				card.hidden = i >= visibleCount;
			});
			sentinel.hidden = visibleCount >= grid.children.length;
		}

		function applyFilter() {
			var keyword = searchInput.value.trim().toLowerCase();
			searching = keyword !== '';

			if (!searching) {
				render();
				if (searchEmpty) searchEmpty.hidden = true;
				return;
			}

			var matchCount = 0;
			Array.prototype.forEach.call(grid.children, function (card) {
				var name = (card.dataset.searchName || '').toLowerCase();
				var matches = name.includes(keyword);
				card.hidden = !matches;
				if (matches) matchCount++;
			});
			// 검색 결과는 배치로 안 나누고 매칭되는 카드를 전부 보여주므로, 검색
			// 중엔 "더 불러오기" 자체가 필요 없다.
			sentinel.hidden = true;
			spinner.classList.remove('is-active');
			if (searchEmpty) searchEmpty.hidden = matchCount > 0;
		}

		function revealNextBatch() {
			var cards = Array.prototype.slice.call(grid.children);
			var start = visibleCount;
			var end = Math.min(visibleCount + PAGE_SIZE, cards.length);

			for (var i = start; i < end; i++) {
				cards[i].classList.add('favorites-card--enter');
				cards[i].hidden = false;
			}
			visibleCount = end;
			sentinel.hidden = visibleCount >= cards.length;

			// 카드를 opacity:0 상태로 한 프레임 그리게 한 뒤에 --enter를 떼야
			// 트랜지션이 실제로 재생된다(같은 프레임에서 바로 떼면 애니메이션 없이 나타남).
			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					for (var i = start; i < end; i++) {
						cards[i].classList.remove('favorites-card--enter');
					}
				});
			});
		}

		function showMore() {
			if (loading || searching || visibleCount >= grid.children.length) return;
			loading = true;
			spinner.classList.add('is-active');

			setTimeout(function () {
				revealNextBatch();
				spinner.classList.remove('is-active');
				loading = false;
			}, LOAD_DELAY_MS);
		}

		render();

		if (searchInput) {
			searchInput.addEventListener('input', applyFilter);
			searchInput.addEventListener('keydown', function (e) {
				if (e.key === 'Enter') {
					e.preventDefault();
					applyFilter();
				}
			});
		}

		if ('IntersectionObserver' in window) {
			// rootMargin을 0으로 두면 마지막 줄이 화면에 딱 걸치자마자 바로 로딩돼서
			// "이어서 불러왔다"는 느낌이 잘 안 든다. 화면 아래쪽을 150px 안으로
			// 당겨서(음수 bottom) sentinel이 그만큼 더 스크롤돼 들어와야, 즉 마지막
			// 줄을 다 보고 나서 한 템포 더 내려야 다음 묶음이 불러와지게 한다.
			var observer = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) showMore();
				});
			}, { rootMargin: '0px 0px -150px 0px' });
			observer.observe(sentinel);
		}

		new MutationObserver(function () {
			if (searching) applyFilter(); else render();
		}).observe(grid, { childList: true });
	});
})();
