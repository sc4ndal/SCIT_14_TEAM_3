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
