/**
 * map-common.js
 *
 * 사찰 지도 관련 공통 함수 모음.
 * 사찰 찾아보기 / 템플스테이 상세보기 / 마이페이지 즐겨찾기,
 * 이 3개 페이지에서 전부 이 파일을 불러와서 씁니다.
 *
 * 사용 전제:
 *   - 이 파일보다 먼저 카카오맵 SDK(sdk.js) 스크립트가 로드되어 있어야 함
 *   - kakao.maps.load(...) 콜백 안에서 map 객체를 만든 뒤, 그 map을 인자로 넘겨서 호출
 */

/**
 * 사찰 마커 하나를 지도에 생성한다. (이미지 마커 + hover 이름표 + 클릭 상세정보)
 *
 * @param {kakao.maps.Map} map - 마커를 올릴 지도 객체
 * @param {Object} temple - 사찰 정보
 * @param {number} temple.lat - 위도
 * @param {number} temple.lng - 경도
 * @param {string} temple.name - 사찰 이름 (hover 이름표, 상세정보에 표시)
 * @param {string} temple.address - 사찰 주소 (상세정보에 표시)
 * @param {string} temple.iconUrl - 마커로 쓸 이미지 경로 (예: '/images/temple-marker.png')
 *
 * @returns {kakao.maps.Marker} 생성된 마커 객체 (필요하면 나중에 지우거나 위치 변경할 때 활용)
 */

 var currentOpenInfoWindow = null;

// templeList.js(사찰 찾아보기)에서만 window.favoriteTempleIds를 초기화해뒀음 - 이 파일은
// 사찰 상세/예약/프로그램뷰 페이지에서도 같이 쓰이는데 그 페이지들은 이 배열을 안 만들어서
// 없으면 여기서 만들어둠(즐겨찾기 필터가 없는 페이지에서도 에러 안 나게).
window.favoriteTempleIds = window.favoriteTempleIds || [];

function createTempleMarker(map, temple) {
    // 1. 좌표 객체 생성
    var position = new kakao.maps.LatLng(temple.lat, temple.lng);

    // 2. 마커에 쓸 이미지 설정 (크기 40x40, 기준점은 이미지 하단 중앙)
        var imageSize = new kakao.maps.Size(40, 40);
        var imageOption = { offset: new kakao.maps.Point(20, 40) };
        var markerImage = new kakao.maps.MarkerImage(temple.iconUrl, imageSize, imageOption);

    // 3. 마커 생성 및 지도에 표시
    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage
    });
    marker.setMap(map);

    // 4. 마우스 올렸을 때(hover) 뜨는 이름표 (CustomOverlay - 글자 길이에 딱 맞는 여백)
    var nameTooltipContent = document.createElement('div');
    nameTooltipContent.style.cssText =
        'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;' +
        'background:white;border:1px solid #ccc;border-radius:4px;';
    nameTooltipContent.innerText = temple.name;

    var nameTooltip = new kakao.maps.CustomOverlay({
        position: position,
        content: nameTooltipContent,
        yAnchor: 2.2
    });

    // 5. 클릭했을 때 뜨는 상세 정보창 (이름 + 주소, X 버튼으로 닫기 가능)
    var infoContent = document.createElement('div');
    infoContent.style.cssText = 'padding:5px;';
    infoContent.innerHTML =
        '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;">' +
        '  <div style="font-size:15px;font-weight:bold;">' + temple.name + '</div>' +
        '  <span class = "favorite-wrapper" style="position:relative;display:inline-flex;">' +
        '  <button type="button" class="favorite-star-btn" style="border:none;background:none;font-size:19px;line-height:1;cursor:pointer;color:' + (temple.favorited ? '#f4c25c' : '#ccc') + ';padding:0;">★</button>' +
        '  </span>' +
        '</div>' +
        '<div style="font-size:13px;white-space:nowrap;">' + temple.address + '</div>' +
        '<div style="margin-top:6px;white-space:nowrap;">' +
        '  <a href="/temple-detail/' + temple.templeId + '" style="font-size:12px;color:#2e86de;text-decoration:none;">상세보기</a>' +
        '  <a href="#" class="zoom-detail-link" style="font-size:12px;color:#2e86de; text-decoration:none;margin-left:10px;">가까이 보기</a>' +
        '</div>';
    // *. 위치 확대 기능
    var zoomDetailLink = infoContent.querySelector('.zoom-detail-link');
    zoomDetailLink.addEventListener('click', function (e){
        e.preventDefault();

        map.relayout();
        map.setLevel(4);
        map.setCenter(position);

    })


    var favoriteBtn = infoContent.querySelector('.favorite-star-btn');
    var favoriteWrapper = infoContent.querySelector('.favorite-wrapper');
    if (temple.favorited) favoriteBtn.classList.add('active');

    // 6. 즐겨찾기 버튼에 마우스 올렸을 때 뜨는 말풍선 (이름표랑 같은 스타일)
    var favoriteTooltip = document.createElement('div');
    favoriteTooltip.style.cssText =
        'position:absolute;bottom:120%;left:50%;transform:translateX(-50%);' +
            'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;' +
            'background:white;border:1px solid #ccc;border-radius:4px;' +
            'display:none;';
    favoriteTooltip.innerText = '즐겨찾기';
    favoriteWrapper.appendChild(favoriteTooltip);

    favoriteBtn.addEventListener('mouseenter', function() {
        favoriteTooltip.style.display = 'block';
    });
    favoriteBtn.addEventListener('mouseleave', function() {
        favoriteTooltip.style.display = 'none';
    });

    // 7. 정보창 열릴 때, 이미 즐겨찾기 되어있는지 서버에 물어봐서 별표 색 맞춰놓기
    fetch('/api/favoritetemples/' + temple.templeId)
    .then(function (response){
        if (!response.ok) {
            throw new Error('즐겨찾기 상태 확인 실패');
        }
        return response.json();
    })
    .then(function (data) {
        if (data.favorite) {
            favoriteBtn.classList.add('active');
            favoriteBtn.style.color = '#f4c25c';
            // favoriteTempleIds 배열에 이 사찰 ID가 아직 없으면 추가
            if (window.favoriteTempleIds.indexOf(temple.templeId) === -1) {
                window.favoriteTempleIds.push(temple.templeId);
            }
        } else {
            favoriteBtn.classList.remove('active');
            favoriteBtn.style.color = '#ccc';

            // favoriteTempleIds 배열에서 이 사찰 ID의 위치를 찾음
            var idx = window.favoriteTempleIds.indexOf(temple.templeId);
            if (idx !== -1) {
                // 배열 안에 있으면(-1이 아니면) 그 위치에서 1개를 삭제
                window.favoriteTempleIds.splice(idx, 1)
            }
        }
        // refreshFavoriteFilter 함수가 실제로 존재하는지 확인 (안전장치)
        if (typeof window.refreshFavoriteFilter === 'function') {
            window.refreshFavoriteFilter();
        }
    })
    .catch(function (error) {
        console.error(error);
    });

    // 8. 별표 클릭하면 서버에 토글 요청 보내서 실제로 저장/삭제
    favoriteBtn.addEventListener('click', function(){
        fetch('/api/favoritetemples/' + temple.templeId + '/toggle', {
            method: 'POST'
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('즐겨찾기 처리 실패 (로그인이 필요할 수 있어요.)');
                }
                return response.json();
            })
            .then(function (data) {
                if (data.favorite) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.style.color = '#f4c25c';
                     if (window.favoriteTempleIds.indexOf(temple.templeId) === -1) {
                                        window.favoriteTempleIds.push(temple.templeId);
                     }
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.style.color = '#ccc';

                    // favoriteTempleIds 배열에서 이 사찰 ID의 위치를 찾아서 삭제
                    var idx = window.favoriteTempleIds.indexOf(temple.templeId);
                    if (idx !== -1) {
                        window.favoriteTempleIds.splice(idx, 1);
                    }
                }
                 if (typeof window.refreshFavoriteFilter === 'function') {
                    window.refreshFavoriteFilter();
                    }
            })
            .catch(function (error) {
                console.error(error);
                alert('로그인 후 즐겨찾기가 가능합니다.')
                location.href = '/login';
            });
    });

    var infowindow = new kakao.maps.InfoWindow({
         content: infoContent,
         removable: true
    });


    // 9. 이벤트 등록: 마우스 오버 → 이름표 표시
    kakao.maps.event.addListener(marker, 'mouseover', function () {
        nameTooltip.setMap(map);
    });

    // 10. 이벤트 등록: 마우스 아웃 → 이름표 숨김
    kakao.maps.event.addListener(marker, 'mouseout', function () {
        nameTooltip.setMap(null);
    });

     kakao.maps.event.addListener(marker, 'click', function () {
            // 이전에 열려있던 정보창이 있으면 닫기
            if (currentOpenInfoWindow) {
                currentOpenInfoWindow.close();
            }
            infowindow.open(map, marker);
            currentOpenInfoWindow = infowindow; // 지금 연 걸 "현재 열린 것"으로 기억
        });

    return marker;
}

/**
 * 지도의 빈 공간(마커 아닌 곳)을 클릭하면 특정 정보창을 닫아주는 헬퍼.
 * 페이지에서 마커를 여러 개 만들었다면, 마지막으로 연 정보창을 기억해뒀다가
 * 이 함수로 지도 클릭 시 닫아주는 식으로 활용하면 됨.
 *
 * @param {kakao.maps.Map} map
 * @param {kakao.maps.InfoWindow} infowindow
 */
function closeInfoWindowOnMapClick(map, infowindow) {
    kakao.maps.event.addListener(map, 'click', function () {
        infowindow.close();
    });
}