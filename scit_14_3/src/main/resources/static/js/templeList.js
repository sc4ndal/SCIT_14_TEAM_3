// templeList.js
// /api/temples 에서 사찰 목록(JSON)을 받아와서, 사찰마다 마커를 하나씩 지도에 찍는다.
// 마커 자체를 만드는 로직은 map-common.js의 createTempleMarker 함수를 그대로 재사용한다.

kakao.maps.load(function () {
    // 대한민국 전체가 보이도록 넓게 설정 (사찰들이 전국에 퍼져있으므로)
    var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(35.9, 127.7),
        level: 13
    });

    fetch('/api/temples')
        .then(function (response) {
            if (!response.ok) {
                throw new Error('서버 응답 오류: ' + response.status);
            }
            return response.json();
        })
        .then(function (temples) {
            if (!temples || temples.length === 0) {
                console.warn('불러온 사찰 데이터가 없습니다.');
                return;
            }

            temples.forEach(function (temple) {
                createTempleMarker(map, {
                    templeId: temple.templeId,
                    lat: temple.latitude,
                    lng: temple.longitude,
                    name: temple.name,
                    address: temple.address,
                    // imageUrl이 없으면(null) 기본 마커 이미지로 대체
                    iconUrl: temple.imageUrl || '/images/temple-marker.svg'
                });
            });
        })
        .catch(function (error) {
            console.error('사찰 목록을 불러오는 중 오류 발생:', error);
        });
});
