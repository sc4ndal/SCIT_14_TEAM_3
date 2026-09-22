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

// 언어 전환 시 마커 이름표/정보창을 다시 그리기 위해 만들어둔 마커 전부를 기억해둠
// (templeI18n.js가 로드된 페이지에서만 의미 있음 - 없으면 그냥 항상 한국어로 남음).
window.__templeMarkerRegistry = window.__templeMarkerRegistry || [];

/** 언어 버튼을 누르면 findTemple.i18n.js 등 각 페이지의 onLanguageChange가 이 함수를 불러서
    이미 만들어져 있는 마커들의 이름표/정보창 문구를 사전 번역 값으로 다시 그림. */
function refreshTempleMarkerLanguage(lang) {
    var hasTempleDict = typeof translateTempleName === 'function'; // 사전 파일 미로드 페이지는 사찰명/주소는 건너뜀
    var favoriteText = favoriteTooltipText(lang);
    window.__templeMarkerRegistry.forEach(function (entry) {
        var temple = entry.temple;
        if (hasTempleDict) {
            var name = translateTempleName(temple.name, lang);
            var address = translateTempleAddress(temple.address, temple.name, lang);
            // 클래스를 먼저 바꾼 뒤 텍스트를 써야 관찰자가 새 텍스트를 볼 때 이미 보호돼 있음
            var protectName = isTempleTextFromDict(temple.name, 'name', lang);
            var protectAddress = isTempleTextFromDict(temple.name, 'address', lang);
            if (entry.tooltipEl) { entry.tooltipEl.classList.toggle('no-translate', protectName); entry.tooltipEl.innerText = name; }
            if (entry.infoNameEl) { entry.infoNameEl.classList.toggle('no-translate', protectName); entry.infoNameEl.textContent = name; }
            if (entry.infoAddressEl) { entry.infoAddressEl.classList.toggle('no-translate', protectAddress); entry.infoAddressEl.textContent = address; }
        }
        if (entry.favoriteTooltipEl) entry.favoriteTooltipEl.innerText = favoriteText;
    });
}

/** 즐겨찾기 별 버튼 말풍선 문구 - common.js 전역 사전(I18N_MANUAL_OVERRIDES)을 그대로 씀. */
function favoriteTooltipText(lang) {
    var override = (lang !== 'ko' && typeof I18N_MANUAL_OVERRIDES !== 'undefined')
        && I18N_MANUAL_OVERRIDES['즐겨찾기'] && I18N_MANUAL_OVERRIDES['즐겨찾기'][lang];
    return override || '즐겨찾기';
}
window.refreshTempleMarkerLanguage = refreshTempleMarkerLanguage;

// 사찰 관리자(TEMPLE 계정)는 즐겨찾기 기능이 없으므로, 마커/목록/필터의 즐겨찾기 UI를
// 전부 숨기는 데 이 값을 씀. #auth-info의 data-temple-account는 각 페이지의 th:attr에서
// AppUserDetails.isTempleAccount()를 그대로 넘겨받음.
var IS_TEMPLE_ACCOUNT = (function () {
    var authInfo = document.getElementById('auth-info');
    return !!(authInfo && authInfo.dataset.templeAccount === 'true');
})();

// 사이트 관리자(ADMIN) 계정도 즐겨찾기 기능을 못 쓰게 막았다(FavoriteTempleController의
// @PreAuthorize("hasRole('USER')")) - #auth-info의 data-is-admin은 각 페이지의 th:attr에서
// AppUserDetails.isAdmin()을 그대로 넘겨받음.
var IS_ADMIN = (function () {
    var authInfo = document.getElementById('auth-info');
    return !!(authInfo && authInfo.dataset.isAdmin === 'true');
})();

// 즐겨찾기 UI를 숨겨야 하는 계정(TEMPLE 계정 + ADMIN 계정)을 한 값으로 묶는다 - 아래 코드의
// IS_TEMPLE_ACCOUNT 체크는 전부 이 값을 대신 쓴다.
var HIDE_TEMPLE_FAVORITE = IS_TEMPLE_ACCOUNT || IS_ADMIN;

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
    var hoverImageUrl = buildPinImageUrl('#b0453f'); // PIN_COLOR보다 밝은 톤

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
    marker.hoverImage = hoverMarkerImage; // 목록에서 마우스 올렸을 때 쓸 밝은 이미지도 붙여둠
    marker.setZIndex(1); // 기본 쌓임 순서 - 선택되면 이보다 높게 올려서 다른 마커에 안 가려지게 함
    // 현재 언어에 맞는 이름/주소(사전에 없으면 원문 그대로) - templeI18n.js가 로드 안 된
    // 페이지에서는 translateTempleName이 아예 없으므로 원문을 그대로 씀.
    var currentLang = (typeof i18nCurrentLang !== 'undefined') ? i18nCurrentLang : 'ko';
    var displayName = (typeof translateTempleName === 'function') ? translateTempleName(temple.name, currentLang) : temple.name;
    var displayAddress = (typeof translateTempleAddress === 'function') ? translateTempleAddress(temple.address, temple.name, currentLang) : temple.address;

    // 4. 마우스 올렸을 때(hover) 뜨는 이름표
    var nameTooltipContent = document.createElement('div');
    nameTooltipContent.style.cssText =
        'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;' +
        'background:white;border:1px solid #ccc;border-radius:4px;';
    var hasDict = typeof isTempleTextFromDict === 'function';
    var protectName = hasDict && isTempleTextFromDict(temple.name, 'name', currentLang);
    var protectAddress = hasDict && isTempleTextFromDict(temple.name, 'address', currentLang);
    if (protectName) nameTooltipContent.classList.add('no-translate');
    nameTooltipContent.innerText = displayName;

    var nameTooltip = new kakao.maps.CustomOverlay({
        position: position,
        content: nameTooltipContent,
        yAnchor: 2.6, // 핀 높이(38px)에 맞춰 이름표가 핀 위에 뜨도록 조정한 값
        zIndex: 999999 // 마커 zIndex(최대 999)보다 훨씬 높게 잡아서 항상 마커 위에 뜨게 함
    });
    marker.nameTooltip = nameTooltip; // 목록에서 마우스 올렸을 때도 이름표를 띄우기 위해 마커에 붙여둠

    // 5. 클릭했을 때 뜨는 상세 정보창 (이름 + 주소, X 버튼으로 닫기 가능)
    // 5-1 : 정보창 안의 ★ 버튼을 조건부로만 넣기(사찰 관리자 계정)
          var favoriteStarHtml = HIDE_TEMPLE_FAVORITE ? '' :
                    '  <span class = "favorite-wrapper" style="position:relative;display:inline-flex;">' +
                    '  <button type="button" class="favorite-star-btn" style="border:none;background:none;font-size:19px;line-height:1;cursor:pointer;color:' + (temple.favorited ? '#f4c25c' : '#ccc') + ';padding:0;">★</button>' +
                    '  </span>';

                var infoContent = document.createElement('div');
                infoContent.style.cssText = 'padding:5px;position:relative;';
                infoContent.innerHTML =
                    '<button type="button" class="info-close-btn" style="position:absolute;top:0;right:0;border:none;background:none;font-size:19px;line-height:1;cursor:pointer;color:#999;padding:2px 4px;">×</button>' +
                    '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;padding-right:16px;">' +
                    '  <div class="temple-info-name' + (protectName ? ' no-translate' : '') + '" style="font-size:15px;font-weight:bold;">' + displayName + '</div>' +
                    favoriteStarHtml +
                    '</div>' +
                    '<div class="temple-info-address' + (protectAddress ? ' no-translate' : '') + '" style="font-size:13px;white-space:nowrap;">' + displayAddress + '</div>' +
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

       var favoriteBtn = null;
       var favoriteWrapper = null;
       var favoriteTooltip = null;
       if (!HIDE_TEMPLE_FAVORITE) {
           favoriteBtn = infoContent.querySelector('.favorite-star-btn');
           favoriteWrapper = infoContent.querySelector('.favorite-wrapper');
           if (temple.favorited) favoriteBtn.classList.add('active');
       }

        // * 커스텀 닫기 버튼: 정보창 닫으면서 선택된 마커 색도 원래대로 복구
           var infoCloseBtn = infoContent.querySelector('.info-close-btn');
           infoCloseBtn.addEventListener('click', function (e) {
               e.stopPropagation(); // 지도까지 클릭이 전파돼서 다른 로직이 겹쳐 도는 걸 막음
               infowindow.close();
               marker.setZIndex(1); // 쌓임 순서도 원래대로 복구
               marker.setImage(marker.normalImage); // 선택 색 원래대로 복구
               if (currentOpenInfoWindow === infowindow) {
                   currentOpenInfoWindow = null;
               }
               if (currentOpenMarker === marker) {
                   currentOpenMarker = null;
               }
           });

       // 사찰 관리자(TEMPLE 계정)는 즐겨찾기 기능이 없으므로 6~8번(말풍선/조회/토글) 전부 건너뜀
       if (!HIDE_TEMPLE_FAVORITE) {
           // 6. 즐겨찾기 버튼에 마우스 올렸을 때 뜨는 말풍선 (이름표랑 같은 스타일)
           favoriteTooltip = document.createElement('div');
           favoriteTooltip.style.cssText =
               'position:absolute;bottom:120%;left:50%;transform:translateX(-50%);' +
                   'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;' +
                   'background:white;border:1px solid #ccc;border-radius:4px;' +
                   'display:none;';
           favoriteTooltip.innerText = favoriteTooltipText(currentLang);
           favoriteWrapper.appendChild(favoriteTooltip);

           favoriteBtn.addEventListener('mouseenter', function() {
               favoriteTooltip.style.display = 'block';
           });
           favoriteBtn.addEventListener('mouseleave', function() {
               favoriteTooltip.style.display = 'none';
           });

           // 7. 정보창 열릴 때, 이미 즐겨찾기 되어있는지 서버에 물어봐서 별표 색 맞춰놓기
           if (temple.favorited !== undefined) {
               if (temple.favorited) {
                   if (window.favoriteTempleIds.indexOf(temple.templeId) === -1) {
                       window.favoriteTempleIds.push(temple.templeId);
                   }
               }
           } else if (document.getElementById('auth-info')) {
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
                e.stopPropagation();
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
       }
        var infowindow = new kakao.maps.InfoWindow({
            content: infoContent,
            removable: false,
            zIndex: 999999, // 마커 zIndex보다 훨씬 높게 잡아서 항상 마커 위에 뜨게 함
            // 검색 지도(findTemple)는 위에 뜬 패널 때문에 autoPan을 꺼두지만,
            // temple.autoPan을 true로 넘긴 페이지(상세보기 등)는 카카오가 알아서
            // 위치를 보정하도록 autoPan을 켜준다.
            disableAutoPan: !temple.autoPan
        });

     // 번역기 등으로 infoContent 내부 텍스트 줄 수가 나중에 바뀌면(폭은 고정이라 높이만 바뀜)
        // InfoWindow가 다시 측정하도록 닫았다 열어줌 (번역 후 하단 잘림 방지)
        if (window.ResizeObserver) {
            var infoResizeObserver = new ResizeObserver(function () {
                if (currentOpenInfoWindow === infowindow) {
                    infowindow.close();
                    infowindow.open(map, marker);
                }
            });
            infoResizeObserver.observe(infoContent);
        }

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
                currentOpenMarker.setZIndex(1);
            }

            // 마커가 화면 위쪽(검색창/필터 패널에 가려지는 영역)에 있으면
            // 정보창이 패널 밑에 깔리지 않게 지도를 살짝 아래로 밀어줌
            var TOP_SAFE_AREA = 130; // 컨트롤 패널이 차지하는 대략적인 높이 + 여유
            var point = map.getProjection().pointFromCoords(position);
                    console.log('marker point.y =', point.y);

            infowindow.open(map, marker);

        currentOpenInfoWindow = infowindow; // 지금 연 걸 "현재 열린 것"으로 기억
        marker.setImage(hoverMarkerImage);  // 선택된 마커는 밝은 색으로 고정
        marker.setZIndex(999); // 다른 마커들 위로 올려서 안 가려지게 함
        currentOpenMarker = marker;
    });

    window.__templeMarkerRegistry.push({
        temple: temple,
        tooltipEl: nameTooltipContent,
        infoNameEl: infoContent.querySelector('.temple-info-name'),
        infoAddressEl: infoContent.querySelector('.temple-info-address'),
        favoriteTooltipEl: favoriteTooltip
    });

    return marker;
}
/**
 * 단일 마커 상세 지도(프로그램 상세보기, 예약 신청 완료 등)를 만들거나 갱신한다.
 * 호출하는 쪽은 자기 페이지 전용 상태 객체({map:null, marker:null})를 만들어서 넘기면 됨 -
 * 지도 인스턴스는 컨테이너마다 하나씩 따로 관리해야 해서(같은 지도 객체를 두 컨테이너에서 못 씀)
 * 상태를 호출하는 쪽에 둔다.
 *
 * @param {string} containerId - 지도를 그릴 div의 id (예: 'detail-map', 'result-map')
 * @param {Object} program - templeId/latitude/longitude/templeName/templeAddress를 담은 객체
 * @param {Object} mapState - { map: kakao.maps.Map|null, marker: kakao.maps.Marker|null } - 페이지에서 만들어서 넘김
 */
function loadTempleDetailMap(containerId, program, mapState) {
    if (typeof kakao === 'undefined' || !program.latitude || !program.longitude) return;

    kakao.maps.load(function () {
        var position = new kakao.maps.LatLng(program.latitude, program.longitude);

        if (!mapState.map) {
            mapState.map = new kakao.maps.Map(document.getElementById(containerId), {
                center: position,
                level: 4
            });
        }

        // 지도를 만들 때 컨테이너가 hidden이 막 풀린 직후일 수 있어서(크기가 0으로
        // 측정돼 마커 위치가 어긋남) relayout으로 컨테이너 크기를 다시 재게 함.
        mapState.map.relayout();
        mapState.map.setCenter(position);

        if (mapState.marker) {
            mapState.marker.setMap(null);
        }

        mapState.marker = createTempleMarker(mapState.map, {
            templeId: program.templeId,
            lat: program.latitude,
            lng: program.longitude,
            name: program.templeName,
            address: program.templeAddress,
            autoPan: true // 이 지도들은 위에 덮이는 패널이 없으니 카카오가 알아서 위치 보정하게 함
        });
        kakao.maps.event.trigger(mapState.marker, 'click');
    });
}


/**
 * 지도의 빈 공간(마커 아닌 곳)을 클릭하면 특정 정보창을 닫아주는 헬퍼.
 */
function closeInfoWindowOnMapClick(map, infowindow) {
    kakao.maps.event.addListener(map, 'click', function () {
        infowindow.close();
    });
}