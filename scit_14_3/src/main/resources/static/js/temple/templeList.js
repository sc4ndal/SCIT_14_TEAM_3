// templeList.js
// /api/temples 에서 사찰 목록(JSON)을 받아와서, 사찰마다 마커를 하나씩 지도에 찍는다.
// 마커 자체를 만드는 로직은 map-common.js의 createTempleMarker 함수를 그대로 재사용한다.
//
// 추가: 검색창에서 "사찰 검색"/"주소 검색"을 골라 검색하면,
//       해당 사찰로 지도 중심을 옮기고 마커를 클릭한 것처럼 정보창을 띄운다.

kakao.maps.load(function () {
    // 대한민국 전체가 보이도록 넓게 설정 (사찰들이 전국에 퍼져있으므로)
    var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(35.9, 127.7),
        level: 13
    });

    // 검색 기능에서 쓰기 위해 사찰 데이터 + 마커를 기억해둔다 (templeId 기준)
    var templeList = [];         // /api/temples 응답 그대로 저장
    var markerByTempleId = {};   // { templeId: kakao.maps.Marker }

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

            templeList = temples;

            temples.forEach(function (temple) {
                var marker = createTempleMarker(map, {
                    templeId: temple.templeId,
                    lat: temple.latitude,
                    lng: temple.longitude,
                    name: temple.name,
                    address: temple.address,
                    // imageUrl이 없으면(null) 기본 마커 이미지로 대체
                    iconUrl: temple.imageUrl || '/images/temple-marker.svg'
                });

                markerByTempleId[temple.templeId] = marker;
            });
        })
        .catch(function (error) {
            console.error('사찰 목록을 불러오는 중 오류 발생:', error);
        });

    // ------------------------- 검색 -------------------------

    function runSearch() {
        var type = document.getElementById('search-type').value; // 'name' 또는 'address'
        var keyword = document.getElementById('search-keyword').value.trim();

        if (!keyword) {
            alert('검색어를 입력해 주세요.');
            return;
        }

        var found = templeList.find(function (temple) {
            var target = type === 'address' ? temple.address : temple.name;
            return target && target.indexOf(keyword) !== -1;
        });

        if (!found) {
            alert('검색 결과가 없습니다.');
            return;
        }

        // 지도 중심을 검색된 사찰로 이동 + 좀 더 가깝게 확대
        map.setCenter(new kakao.maps.LatLng(found.latitude, found.longitude));
        map.setLevel(4);

        // 해당 마커를 클릭한 것처럼 처리해서 정보창 띄우기
        var marker = markerByTempleId[found.templeId];
        if (marker) {
            kakao.maps.event.trigger(marker, 'click');
        }
    }

    document.getElementById('search-btn').addEventListener('click', runSearch);

    // 입력창에서 엔터키로도 검색되게
    document.getElementById('search-keyword').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            runSearch();
        }
    });
});
