// templeDetail.js
// 사찰 상세보기 페이지 - 위치 지도 하나만 그린다. (사찰 정보/프로그램 목록은 서버가 이미 화면에 다 채워서 내려줌)

kakao.maps.load(function () {
    var position = new kakao.maps.LatLng(TEMPLE_LAT, TEMPLE_LNG);

    var map = new kakao.maps.Map(document.getElementById('temple-map'), {
        center: position,
        level: 4
    });

    var marker = createTempleMarker(map, {
        templeId: TEMPLE_ID,
        lat: TEMPLE_LAT,
        lng: TEMPLE_LNG,
        name: TEMPLE_NAME,
        address: TEMPLE_ADDRESS,
        iconUrl: '/images/temple-marker.svg'
    });

    kakao.maps.event.trigger(marker, 'click'); // 정보창도 바로 열어줌
});

// ===== 즐겨찾기 버튼 =====
// 즐겨찾기 토글은 FavoriteTempleController(/api/favoritetemples/{id}/toggle)로 일원화됨
document.getElementById('favorite-btn').addEventListener('click', function () {
    var btn = this;
    fetch('/api/favoritetemples/' + TEMPLE_ID + '/toggle', { method: 'POST' })
        .then(function (res) {
            if (!res.ok) {
                throw new Error('즐겨찾기 처리 실패 (로그인이 필요할 수 있어요.)');
            }
            return res.json();
        })
        .then(function (data) {
            btn.classList.toggle('active', data.favorite);
        })
        .catch(function () {
            alert('로그인 후 즐겨찾기가 가능합니다.');
            location.href = '/login';
        });
});
