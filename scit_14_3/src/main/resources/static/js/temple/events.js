/* ============================================================
   events.js — /events 전용
   검색창에 입력한 글자가 행사명이나 사찰명에 포함되면 보여주고, 아니면 카드를 숨긴다.
   food.js와 동일한 방식 - 타이핑하는 즉시 걸러지고, 엔터를 눌러도 같은 결과가 반영된다.
   ============================================================ */

(function () {
	var input = document.getElementById('events-search-input');
	if (!input) return;

	var grid = document.getElementById('events-grid');
	var empty = document.getElementById('events-search-empty');
	var cards = Array.prototype.slice.call(grid.querySelectorAll('.event-card'));

	function applyFilter() {
		var keyword = input.value.trim().toLowerCase();
		var visibleCount = 0;

		cards.forEach(function (card) {
			var name = (card.dataset.eventName || '').toLowerCase();
			var matches = keyword === '' || name.includes(keyword);
			card.hidden = !matches;
			if (matches) visibleCount++;
		});

		empty.hidden = visibleCount > 0;
	}

	input.addEventListener('input', applyFilter);

	input.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyFilter();
		}
	});
})();
