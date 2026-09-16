/* ============================================================
   food.js — /info/food 전용
   검색창에 입력한 글자가 음식 이름에 포함되면 보여주고, 아니면 카드를 숨긴다.
   음식이 20개 안팎이라 서버 재요청 없이 클라이언트에서 바로 걸러낸다.
   타이핑할 때마다 바로 걸러지고(live), 엔터를 눌러도 같은 결과가 즉시 반영된다.
   ============================================================ */

(function () {
	var input = document.getElementById('food-search-input');
	if (!input) return;

	var grid = document.getElementById('food-grid');
	var empty = document.getElementById('food-search-empty');
	var cards = Array.prototype.slice.call(grid.querySelectorAll('.food-card'));

	function applyFilter() {
		var keyword = input.value.trim().toLowerCase();
		var visibleCount = 0;

		cards.forEach(function (card) {
			var name = (card.dataset.foodName || '').toLowerCase();
			var matches = keyword === '' || name.includes(keyword);
			card.hidden = !matches;
			if (matches) visibleCount++;
		});

		empty.hidden = visibleCount > 0;
	}

	input.addEventListener('input', applyFilter);

	// 폼 안에 있지 않아 엔터를 눌러도 페이지가 새로고침되지는 않지만, "검색어 치고 엔터"를
	// 기대하는 사용자를 위해 명시적으로도 같은 필터를 한 번 더 적용해준다.
	input.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyFilter();
		}
	});
})();
