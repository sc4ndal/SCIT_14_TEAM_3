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
    var infowindow = new kakao.maps.InfoWindow({
        content:
            '<div style="padding:5px;width: 180px;">' +
            '  <div style="font-size:15px;font-weight:bold;">' + temple.name + '</div>' +
            '  <div style="font-size:13px;">' + temple.address + '</div>' +
            '  <div style="margin-top:6px;">' +
            '    <a href="/temple-detail/' + temple.templeId + '" style="font-size:12px;color:#2e86de;text-decoration:none;">상세보기</a>' +
            '  </div>' +
            '</div>',
        removable: true
    });

    // 6. 이벤트 등록: 마우스 오버 → 이름표 표시
    kakao.maps.event.addListener(marker, 'mouseover', function () {
        nameTooltip.setMap(map);
    });

    // 7. 이벤트 등록: 마우스 아웃 → 이름표 숨김
    kakao.maps.event.addListener(marker, 'mouseout', function () {
        nameTooltip.setMap(null);
    });

//    // 8. 이벤트 등록: 마커 클릭 → 상세 정보창 열기
//    kakao.maps.event.addListener(marker, 'click', function () {
//        infowindow.open(map, marker);
//    });

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





//kakao.maps.load(function() {
//    var container = document.getElementById('map');
//    var options = {
//        center: new kakao.maps.LatLng(35.1796, 129.0756),
//        level: 8
//    };
//    var map = new kakao.maps.Map(container, options);
//
//    var position = new kakao.maps.LatLng(35.1796, 129.0756);
//
//    var svg = `
//<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
//    <text x="50%" y="50%" font-size="28" text-anchor="middle" dominant-baseline="central">🛕</text>
//</svg>`;
//    var imageSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
//    var imageSize = new kakao.maps.Size(40, 40);
//    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
//
//    var marker = new kakao.maps.Marker({
//        position: position,
//        image: markerImage
//    });
//    marker.setMap(map);
//
//    // CustomOverlay로 만든 hover 이름표
//    var nameTooltipContent = document.createElement('div');
//    nameTooltipContent.style.cssText = 'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;background:white;border:1px solid #ccc;border-radius:4px;';
//    nameTooltipContent.innerText = '범어사';
//
//    var nameTooltip = new kakao.maps.CustomOverlay({
//        position: position,
//        content: nameTooltipContent,
//        yAnchor: 2.2
//    });
//
//    // 클릭했을 때 뜨는 상세 정보창
//    var infowindow = new kakao.maps.InfoWindow({
//        content: `
//            <div style="padding:5px;">
//                <div style="font-size:15px;font-weight:bold;">범어사</div>
//                <div style="font-size:13px;">부산 금정구 범어사로 250</div>
//            </div>
//        `,
//         removable: true
//    });
//
//    kakao.maps.event.addListener(marker, 'click', function() {
//        infowindow.open(map, marker);
//    });
//
//    // 지도의 빈 곳을 클릭하면 정보창 닫기
//    kakao.maps.event.addListener(map, 'click', function() {
//        infowindow.close();
//    });
//
//    // 마우스 올리면 이름표(CustomOverlay) 보여주기
//    kakao.maps.event.addListener(marker, 'mouseover', function() {
//        nameTooltip.setMap(map);
//    });
//
//    // 마우스 벗어나면 이름표 숨기기
//    kakao.maps.event.addListener(marker, 'mouseout', function() {
//        nameTooltip.setMap(null);
//    });
//
//    // 클릭하면 상세 정보창(InfoWindow) 열기
//    kakao.maps.event.addListener(marker, 'click', function() {
//        infowindow.open(map, marker);
//    });
//});