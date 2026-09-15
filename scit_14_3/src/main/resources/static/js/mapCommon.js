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
 * 사찰 마커 하나를 지도에 생성한다. (커스텀 핀 + hover 이름표 + 클릭 상세정보)
 *
 * @param {kakao.maps.Map} map - 마커를 올릴 지도 객체
 * @param {Object} temple - 사찰 정보
 * @param {number} temple.lat - 위도
 * @param {number} temple.lng - 경도
 * @param {string} temple.name - 사찰 이름
 * @param {string} temple.address - 사찰 주소
 *
 * @returns {kakao.maps.CustomOverlay} 생성된 마커(CustomOverlay) 객체
 */
var currentOpenInfoWindow = null;
var currentOpenMarker = null; // 지금 색이 바뀐 채로 "선택된" 마커를 기억해둠

// templeList.js(사찰 찾아보기)에서만 window.favoriteTempleIds를 초기화해뒀음 - 이 파일은
// 사찰 상세/예약/프로그램뷰 페이지에서도 같이 쓰이는데 그 페이지들은 이 배열을 안 만들어서
// 없으면 여기서 만들어둠(즐겨찾기 필터가 없는 페이지에서도 에러 안 나게).
window.favoriteTempleIds = window.favoriteTempleIds || [];

// ===== 마커 핀 디자인 설정 =====
// 핀 색(자주+갈색 톤)이랑 문양 색(금색). 여기 두 값만 바꾸면 모든 마커 색이 한번에 바뀜.
var PIN_COLOR = '#6c3836';
var PATTERN_COLOR = '#c0a479';

/**
 * 물방울 핀 모양 SVG 문자열을 만들어서 돌려주는 함수.
 * fillColor를 다르게 넣으면 같은 모양, 다른 색의 핀을 만들 수 있음
 * (기본 상태 핀 / hover 상태 핀을 각각 만들 때 재사용).
 *
 * @param {string} fillColor - 핀 몸통 색
 * @returns {string} data URI 형태의 이미지 경로 (MarkerImage에 그대로 넣을 수 있음)
 */
function buildPinImageUrl(fillColor) {
     // btoa()로 문자열을 base64로 인코딩해서 "이미지 파일처럼 보이는 주소(data URI)"를 만듦.
     // 이렇게 하면 실제 이미지 파일(.png/.svg)을 서버에 올리지 않고도 MarkerImage에 바로 쓸 수 있음.
     var svg =
         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" width="40" height="46">' +
             '<path d="M12 1C7.58 1 4 4.58 4 9c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8z" ' +
                 'fill="' + fillColor + '" stroke="' + PATTERN_COLOR + '" stroke-width="1.2"/>' +
             '<circle cx="12" cy="8.8" r="4.3" fill="none" stroke="' + PATTERN_COLOR + '" stroke-width="0.9"/>' +
             '<circle cx="12" cy="8.8" r="1.1" fill="' + PATTERN_COLOR + '"/>' +
         '</svg>';
     return 'data:image/svg+xml;base64,' + btoa(svg);
 }

function createTempleMarker(map, temple) {
    // 1. 좌표 객체 생성
    var position = new kakao.maps.LatLng(temple.lat, temple.lng);

    // 2. 마커에 쓸 이미지 설정
    //    - 기본 이미지: 평소 보이는 핀
    //    - hover 이미지: 마우스 올렸을 때 보여줄, 살짝 밝은 색 핀
    //    (CSS로 부드럽게 커지는 애니메이션은 못 넣지만, 마우스 올렸을 때
    //     이미지 자체가 바뀌면서 "밝아지는" 효과는 낼 수 있음)
    var imageSize = new kakao.maps.Size(32, 37);
    var imageOption = { offset: new kakao.maps.Point(16, 33) }; // 기준점: 핀 뾰족한 끝(하단 중앙)

    var normalImageUrl = buildPinImageUrl(PIN_COLOR);
    var hoverImageUrl = buildPinImageUrl('#8a4a48'); // PIN_COLOR보다 밝은 톤

    var markerImage = new kakao.maps.MarkerImage(normalImageUrl, imageSize, imageOption);
    var hoverMarkerImage = new kakao.maps.MarkerImage(hoverImageUrl, imageSize, imageOption);

    // 3. 마커 생성 및 지도에 표시
    //    실제 kakao.maps.Marker를 쓰기 때문에, 정보창 위치 계산이나 이벤트 시스템을
    //    전부 카카오가 알아서 처리해줌 (CustomOverlay였을 때 겪었던 버그들이 다 사라짐)
    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage
    });
    marker.setMap(map);
     marker.normalImage = markerImage; // 나중에 "선택 해제"할 때 되돌릴 원래 이미지를 마커에 붙여둠

    // 4. 마우스 올렸을 때(hover) 뜨는 이름표
    var nameTooltipContent = document.createElement('div');
    nameTooltipContent.style.cssText =
        'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;' +
        'background:white;border:1px solid #ccc;border-radius:4px;';
    nameTooltipContent.innerText = temple.name;

    var nameTooltip = new kakao.maps.CustomOverlay({
        position: position,
        content: nameTooltipContent,
        yAnchor: 2.6 // 핀 높이(38px)에 맞춰 이름표가 핀 위에 뜨도록 조정한 값
    });

    // 5. 클릭했을 때 뜨는 상세 정보창 (이름 + 주소, X 버튼으로 닫기 가능)
        var infoContent = document.createElement('div');
        infoContent.style.cssText = 'padding:5px;position:relative;';
        infoContent.innerHTML =
            '<button type="button" class="info-close-btn" style="position:absolute;top:0;right:0;border:none;background:none;font-size:15px;line-height:1;cursor:pointer;color:#999;padding:2px 4px;">×</button>' +
            '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;padding-right:16px;">' +
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

     // * 커스텀 닫기 버튼: 정보창 닫으면서 선택된 마커 색도 원래대로 복구
        var infoCloseBtn = infoContent.querySelector('.info-close-btn');
        infoCloseBtn.addEventListener('click', function (e) {
            e.stopPropagation(); // 지도까지 클릭이 전파돼서 다른 로직이 겹쳐 도는 걸 막음
            infowindow.close();
            marker.setImage(marker.normalImage); // 선택 색 원래대로 복구
            if (currentOpenInfoWindow === infowindow) {
                currentOpenInfoWindow = null;
            }
            if (currentOpenMarker === marker) {
                currentOpenMarker = null;
            }
        });

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
    // 호출부가 temple.favorited를 이미 넘겨준 경우(templeList.js처럼 /api/temples가 한 번에
    // 다 채워서 내려준 경우)는 위 3번/6번에서 이미 별색을 맞춰놨으니 같은 정보를 또
    // 물어보지 않고 favoriteTempleIds만 맞춰준다. 안 넘겨준 경우(templeDetail.js,
    // reservation.js, templestayView.js - 단일 마커라 미리 조회 안 함)만 여기서 조회.
    if (temple.favorited !== undefined) {
        if (temple.favorited) {
            if (window.favoriteTempleIds.indexOf(temple.templeId) === -1) {
                window.favoriteTempleIds.push(temple.templeId);
            }
        }
    } else if (document.getElementById('auth-info')) {
        // 로그인 상태일 때만 조회 - 이 API는 인증이 필요해서(@PreAuthorize), 비로그인
        // 방문자가 마커를 열 때마다 호출하면 401만 쌓이고 별색도 어차피 항상 회색이라 의미 없음.
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
                if (window.favoriteTempleIds.indexOf(temple.templeId) === -1) {
                    window.favoriteTempleIds.push(temple.templeId);
                }
            } else {
                favoriteBtn.classList.remove('active');
                favoriteBtn.style.color = '#ccc';
                var idx = window.favoriteTempleIds.indexOf(temple.templeId);
                if (idx !== -1) {
                    window.favoriteTempleIds.splice(idx, 1)
                }
            }
            if (typeof window.refreshFavoriteFilter === 'function') {
                window.refreshFavoriteFilter();
            }
        })
        .catch(function (error) {
            console.error(error);
        });
    }

    // 8. 별표 클릭하면 서버에 토글 요청 보내서 실제로 저장/삭제
    favoriteBtn.addEventListener('click', function(e){
         e.stopPropagation(); // 클릭이 지도까지 전파돼서 정보창이 닫히는 걸 막음
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
        removable: false
    });

    // 9. 이벤트 등록: 마우스 오버 → 이름표 표시 + 밝은 색 핀으로 교체
    kakao.maps.event.addListener(marker, 'mouseover', function () {
        nameTooltip.setMap(map);
        marker.setImage(hoverMarkerImage); // hover 효과: 이미지 자체를 밝은 버전으로 교체
    });

    // 10. 이벤트 등록: 마우스 아웃 → 이름표 숨김 + 원래 색 핀으로 복구
    kakao.maps.event.addListener(marker, 'mouseout', function () {
        nameTooltip.setMap(null);
        if (marker !== currentOpenMarker) {
                marker.setImage(markerImage); // 선택된 마커가 아닐 때만 원래 이미지로 되돌림
            }
    });

    kakao.maps.event.addListener(marker, 'click', function () {
        // 이전에 열려있던 정보창이 있으면 닫기
        if (currentOpenInfoWindow) {
            currentOpenInfoWindow.close();
        }
        // 이전에 선택돼있던 다른 마커가 있으면 색 원래대로 복구
        if (currentOpenMarker && currentOpenMarker !== marker) {
            currentOpenMarker.setImage(currentOpenMarker.normalImage);
        }
        infowindow.open(map, marker);
        currentOpenInfoWindow = infowindow; // 지금 연 걸 "현재 열린 것"으로 기억
        marker.setImage(hoverMarkerImage);  // 선택된 마커는 밝은 색으로 고정
        currentOpenMarker = marker;
    });

    return marker;
}

/**
 * 지도의 빈 공간(마커 아닌 곳)을 클릭하면 특정 정보창을 닫아주는 헬퍼.
 */
function closeInfoWindowOnMapClick(map, infowindow) {
    kakao.maps.event.addListener(map, 'click', function () {
        infowindow.close();
    });
}