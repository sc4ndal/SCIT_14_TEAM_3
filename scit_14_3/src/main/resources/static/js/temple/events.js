/* ============================================================
   events.js — /events 전용
   ------------------------------------------------------------
   1) 검색: 검색창에 입력한 글자가 행사명이나 사찰명에 포함되면 보여주고,
      아니면 카드를 숨긴다. 타이핑하는 즉시 걸러지고, 엔터를 눌러도 같은
      결과가 반영된다. 검색 중에는 무한 스크롤 배치를 무시하고 매칭되는
      카드를 전부 보여준다(검색 결과까지 스크롤해서 찾게 하면 안 되므로).

   2) 무한 스크롤: 관심 행사(mypage/favorites/events)와 같은 방식으로,
      검색 중이 아닐 때는 처음 PAGE_SIZE(12)장(4열×3줄)만 보여주고 화면
      아래로 스크롤하면 스피너를 잠깐 보여준 뒤 PAGE_SIZE씩 더 드러낸다.
   ============================================================ */

(function () {
	var PAGE_SIZE = 12;
	var LOAD_DELAY_MS = 300;

	var grid = document.getElementById('events-grid');
	if (!grid) return;

	var cards = Array.prototype.slice.call(grid.querySelectorAll('.event-card'));
	var input = document.getElementById('events-search-input');
	var empty = document.getElementById('events-search-empty');
	var sentinel = document.getElementById('events-infinite-sentinel');

	var spinner = null;
	if (sentinel) {
		spinner = document.createElement('div');
		spinner.className = 'events-loading-spinner';
		spinner.setAttribute('aria-hidden', 'true');
		sentinel.insertAdjacentElement('afterend', spinner);
	}

	var visibleCount = Math.min(PAGE_SIZE, cards.length);
	var loading = false;
	var searching = false;

	function renderBatch() {
		cards.forEach(function (card, i) {
			card.hidden = i >= visibleCount;
		});
		if (sentinel) sentinel.hidden = visibleCount >= cards.length;
	}

	function revealNextBatch() {
		var start = visibleCount;
		var end = Math.min(visibleCount + PAGE_SIZE, cards.length);

		for (var i = start; i < end; i++) {
			cards[i].classList.add('event-card--enter');
			cards[i].hidden = false;
		}
		visibleCount = end;
		if (sentinel) sentinel.hidden = visibleCount >= cards.length;

		// 카드를 opacity:0 상태로 한 프레임 그리게 한 뒤에 --enter를 떼야
		// 트랜지션이 실제로 재생된다(같은 프레임에서 바로 떼면 애니메이션 없이 나타남).
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				for (var i = start; i < end; i++) {
					cards[i].classList.remove('event-card--enter');
				}
			});
		});
	}

	function showMore() {
		if (loading || searching || visibleCount >= cards.length) return;
		loading = true;
		if (spinner) spinner.classList.add('is-active');

		setTimeout(function () {
			revealNextBatch();
			if (spinner) spinner.classList.remove('is-active');
			loading = false;
		}, LOAD_DELAY_MS);
	}

	function applyFilter() {
		if (!input) return;
		var keyword = input.value.trim().toLowerCase();
		searching = keyword !== '';

		if (!searching) {
			renderBatch();
			if (empty) empty.hidden = true;
			return;
		}

		var visibleMatchCount = 0;
		cards.forEach(function (card) {
			var name = (card.dataset.eventName || '').toLowerCase();
			var matches = name.includes(keyword);
			card.hidden = !matches;
			if (matches) visibleMatchCount++;
		});
		// 검색 결과는 배치로 안 나누고 매칭되는 카드를 전부 보여주므로, 검색 중엔
		// "더 불러오기" 자체가 필요 없다.
		if (sentinel) sentinel.hidden = true;
		if (spinner) spinner.classList.remove('is-active');
		if (empty) empty.hidden = visibleMatchCount > 0;
	}

	renderBatch();

	if (input) {
		input.addEventListener('input', applyFilter);
		input.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				applyFilter();
			}
		});
	}

	if (sentinel && 'IntersectionObserver' in window) {
		// rootMargin을 음수로 줘서, 마지막 줄이 화면에 다 들어오고 나서 한 템포 더
		// 내려야 다음 묶음이 불러와지게 한다(관심 행사 페이지와 동일한 값).
		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) showMore();
			});
		}, { rootMargin: '0px 0px -150px 0px' });
		observer.observe(sentinel);
	}
})();
