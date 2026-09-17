// templeList.js
// /api/temples 에서 사찰 목록(JSON)을 받아와서, 사찰마다 마커를 하나씩 지도에 찍는다.
// 마커 자체를 만드는 로직은 map-common.js의 createTempleMarker 함수를 그대로 재사용한다.
//
// 추가: 검색창에서 "사찰 검색"/"주소 검색"을 골라 검색하면,
//       해당 사찰로 지도 중심을 옮기고 마커를 클릭한 것처럼 정보창을 띄운다.

kakao.maps.load(function () {
    // 카드 박스 정렬 맞게끔 설정함.
    function syncSearchBoxWidth() {
        var filterRow = document.getElementById('filter-row');
        var searchBox = document.getElementById('temple-search-box');
        searchBox.style.width = filterRow.offsetWidth + 'px';
    }

    syncSearchBoxWidth();
    window.addEventListener('resize', syncSearchBoxWidth);

    // 대한민국 전체가 보이도록 넓게 설정 (사찰들이 전국에 퍼져있으므로)
    var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(35.9, 127.7),
        level: 13
    });

    // 지도 빈 공간 클릭하면 열려있던 정보창 닫기
    kakao.maps.event.addListener(map, 'click', function () {
        if (currentOpenInfoWindow) {
            currentOpenInfoWindow.close();
            currentOpenInfoWindow = null;
        }
        if (currentOpenMarker) {
            currentOpenMarker.setImage(currentOpenMarker.normalImage);
            currentOpenMarker.setZIndex(1);
            currentOpenMarker = null;
            }
    });

    // 검색 기능에서 쓰기 위해 사찰 데이터 + 마커를 기억해둔다 (templeId 기준)
    var templeList = [];         // /api/temples 응답 그대로 저장
    var markerByTempleId = {};   // { templeId: kakao.maps.Marker }
    // 즐겨찾기에 추가한 데이터 활용 위한 데이터 저장
    var favoriteTempleIds = [];
    window.favoriteTempleIds = favoriteTempleIds; // window에도 같은 배열을 붙여둠.
    // /api/favoritetemples는 비로그인이어도 200(빈 배열)을 내려주게 바뀌어서 이 fetch의
    // 성공/실패로는 더 이상 로그인 여부를 못 가림 - #auth-info(서버 렌더 마커)로 직접 판단함.
    var isLoggedIn = !!document.getElementById('auth-info');
    // null = 검색으로 제한된 게 없음(전체 대상), 배열이면 그 안의 templeId만 허용
    var searchMatchedIds = null;

    fetch('/api/favoritetemples')
        .then(function (response) {
            if (!response.ok) throw new Error('로그인이 필요합니다.')
            return response.json();
        })
        .then(function (ids) {
            favoriteTempleIds.length = 0;           // 기존 내용 비우고
            ids.forEach(function (id) {
                favoriteTempleIds.push(id);         // 새 데이터 하나씩 채워 넣음
            })
        })
        .catch(function () {
            favoriteTempleIds.length = 0;
        });
    showLoading('사찰 정보를 불러오는 중...');
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
                    iconUrl: temple.imageUrl || '/images/temple-marker.svg',
                    favorited: temple.favorited
                });

                markerByTempleId[temple.templeId] = marker;
            });
        })
        .catch(function (error) {
            console.error('사찰 목록을 불러오는 중 오류 발생:', error);
        })
        .finally(function () {
            hideLoading();
        });

            // 사찰의 유형(바다/산/강/도심)을 작은 태그 뱃지로 만들어주는 헬퍼.
            // 필터 버튼(#data-type-*)이랑 같은 색을 써서 서로 연결되어 보이게 함.
            var TEMPLE_TYPE_TAGS = [
                { field: 'supportSea', label: '바다', color: 'var(--blue)'},
                { field: 'supportMountain', label: '산', color: 'var(--green)'},
                { field: 'supportRiver', label: '강', color: 'var(--brown)'},
                { field: 'supportUrban', label: '도심', color: 'var(--gold)'},
                { field: 'supportEnglish', label: '영어지원', color: 'var(--text)'}

            ];

            function buildTypeTagsHtml(temple) {
                return TEMPLE_TYPE_TAGS
                .filter(function (t) { return temple[t.field]; })
                .map(function (t) {
                    return '<span style="font-size:10px;font-weight:700;color:' + t.color + ';border:1px solid ' + t.color + ';border-radius:999px;padding:1px 6px;margin-right:4px;">' + t.label + '</span>';
                })
                .join('');
            }


    // ------------------------- 검색 -------------------------
    function showResultList(temples) {
        // 즐겨찾기한 사찰을 목록 맨 위로 오게 정렬
        // (temples 원본 배열은 그대로 두고, 복사본(slice())을 정렬해서 사용 - 원본을 건드리면 다른 곳에서 꼬일 수 있음)
        var sortedTemples = temples.slice().sort(function (a, b){
            var aFav = favoriteTempleIds.indexOf(a.templeId) !== -1;
            var bFav = favoriteTempleIds.indexOf(b.templeId) !== -1;
            if (aFav === bFav) return 0;
            return aFav ? -1 : 1;
        });
        var list = document.getElementById('result-list');
        list.innerHTML = ''; // 이전 검색 결과 지우기

        sortedTemples.forEach(function (temple){
            var li = document.createElement('li');
            // 검색 결과 리스트에 사찰 이름이랑 주소 표시
            li.innerHTML =
                '<div class="result-row" style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
                '  <div class="result-name">' + temple.name + '</div>' +
                '  <button type="button" class="result-favorite-btn" style="border:none;background:none;font-size:16px;line-height:1;cursor:pointer;color:#ccc;padding:0;">★</button>' +
                '</div>' +
                '<div class="result-address">' + temple.address + '</div>' +
                '<div class="result-types" style="margin-top:4px;">' + buildTypeTagsHtml(temple) + '</div>';

            var favoriteBtn = li.querySelector('.result-favorite-btn');

            // 이미 즐겨찾기 되어있는 사찰이면 처음부터 별표를 채워서 보여줌
            if (favoriteTempleIds.indexOf(temple.templeId) !== -1) {
                favoriteBtn.classList.add('active');
                favoriteBtn.style.color = '#f4c25c';
            }

            // 별표 클릭 - 토글 요청 보내기
            favoriteBtn.addEventListener('click', function (e) {
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

                            if (favoriteTempleIds.indexOf(temple.templeId) === -1) {
                                favoriteTempleIds.push(temple.templeId);
                            }
                        } else {
                            favoriteBtn.classList.remove('active');
                            favoriteBtn.style.color = '#ccc';

                            var idx = favoriteTempleIds.indexOf(temple.templeId);
                            if (idx !== -1) {
                                favoriteTempleIds.splice(idx, 1);
                            }
                        }
                        applyFilters();
                    })
                    .catch(function (error) {
                        console.error(error);
                        alert('로그인 후 즐겨찾기가 가능합니다.');
                        location.href = '/login';
                    });
            });

        // 목록 항목에 마우스 올리면 지도 위 해당 마커도 밝은 색으로 눈에 띄게
        li.addEventListener('mouseenter', function() {
            var hoveredMarker = markerByTempleId[temple.templeId];
            if (hoveredMarker) {
                hoveredMarker.setImage(hoveredMarker.hoverImage);
                hoveredMarker.nameTooltip.setMap(map); // 이름표도 같이 띄움
            }
        });
        li.addEventListener('mouseleave', function () {
            var hoveredMarker = markerByTempleId[temple.templeId];
            if (hoveredMarker) {
                hoveredMarker.nameTooltip.setMap(null); // 이름표는 선택 여부와 상관없이 항상 숨김.
                 // 지금 선택(클릭)돼서 색이 고정된 마커라면 원래 색으로 되돌리지 않음
                 if (hoveredMarker && hoveredMarker !== currentOpenMarker) {
                 hoveredMarker.setImage(hoveredMarker.normalImage);
                 }
            }
        });

        // 리스트 항목을 클릭하면 그 사찰로 이동 + 정보창 열기
        li.addEventListener('click', function() {
            var marker = markerByTempleId[temple.templeId]; // ← markerByTempleId에서 찾아옴
                   if (marker) {
                       kakao.maps.event.trigger(marker, 'click'); // ← Marker는 카카오 이벤트 시스템으로 흉내냄
                   }
            // 지도 중심을 검색된 사찰로 이동 + 좀 더 가깝게 확대
            map.relayout();
            map.setLevel(4);
            map.setCenter(new kakao.maps.LatLng(temple.latitude, temple.longitude));
        });
        list.appendChild(li);
        });
        document.getElementById('result-panel').classList.remove('collapsed');
        updateResultPanelToggle();
    }
    var resultPanel = document.getElementById('result-panel');
    var resultPanelToggle = document.getElementById('result-panel-toggle');

    // 패널 상태에 맞춰서 토글 버튼 화살표 방향 + 위치를 맞춰주는 함수
    function updateResultPanelToggle() {
        if (resultPanel.classList.contains('collapsed')) {
            resultPanelToggle.textContent = '<'             // 패널이 닫혀있으면: 왼쪽 화살표(누르면 열림)
            resultPanelToggle.classList.add('collapsed');
        } else {
            resultPanelToggle.textContent = '>';
            resultPanelToggle.classList.remove('collapsed') // 패널이 열려있으면: 오른쪽 화살표(누르면 닫힘)
        }
    }
    document.getElementById('result-panel-close').addEventListener('click', function () {
        // 검색 조건뿐 아니라 켜져있던 필터 버튼들도 전부 꺼줘야
        // applyFilter()가 패널을 다시 열지 않음
        document.querySelectorAll('#temple-filter-box button.active').forEach(function (btn) {
            btn.classList.remove('active');
        });
        document.getElementById('filter-support-english').classList.remove('active');
        document.getElementById('filter-favorite').classList.remove('active');
        searchMatchedIds = null; // 검색 제한 해제
        document.getElementById('result-list').innerHTML = '';
        applyFilters(); // 위에서 다 껐으니 이제 anyFilterActive가 false가 되어 패널이 실제로 닫힘.
    });

    resultPanelToggle.addEventListener('click', function () {
        resultPanel.classList.toggle('collapsed')
        updateResultPanelToggle();
    });

    updateResultPanelToggle(); // 페이지 로드시 초기 상태 맞추기

    function runSearch() {
        var type = document.getElementById('search-type').value; // 'name' 또는 'address'
        var keyword = document.getElementById('search-keyword').value.trim();

        if (!keyword) {
            searchMatchedIds = null;
            applyFilters(true);
            map.setLevel(13);
            map.setCenter(new kakao.maps.LatLng(35.9, 127.7));
            return;
        }

    if (type === 'address') {
        // 주소/지역 검색 - 조건에 맞는 사찰을 전부 찾는다
        var matched = templeList.filter(function (temple) {
            var addressMatch = temple.address && temple.address.indexOf(keyword) !== -1;
            var regionMatch = temple.region && temple.region.indexOf(keyword) !== -1;
            return addressMatch || regionMatch;
        });

        if (matched.length === 0) {
            alert('검색 결과가 없습니다.');
            return;
        }

        // 검색된 사찰 ID만 기억해두고, 실제 마커 켜고 끄는 건 applyFilters()가 담당하게 함.
        searchMatchedIds = matched.map(function (temple) {
            return temple.templeId;
        });
        applyFilters();

        // 검색된 사찰들이 전부 화면에 들어오게 지도 범위를 맞춘다
        var bounds = new kakao.maps.LatLngBounds();
        matched.forEach(function (temple) {
            bounds.extend(new kakao.maps.LatLng(temple.latitude, temple.longitude));
        });
        map.setBounds(bounds);
        return;
    }

    // 이름 검색은 기존과 동일 - 하나만 찾아서 그 위치로 이동 + 정보창 열기
    var found = templeList.find(function (temple) {
        return temple.name && temple.name.indexOf(keyword) !== -1;
    });

        if (!found) {
            alert('검색 결과가 없습니다.');
            return;
        }

        searchMatchedIds = [found.templeId];
        applyFilters();

        // 해당 마커를 클릭한 것처럼 처리해서 정보창 띄우기
        var marker = markerByTempleId[found.templeId];
            if (marker) {
                kakao.maps.event.trigger(marker, 'click');
            }
        // 지도 중심을 검색된 사찰로 이동 + 좀 더 가깝게 확대
        map.relayout();
        map.setLevel(4);
        map.setCenter(new kakao.maps.LatLng(found.latitude, found.longitude));


        // 해당 마커를 클릭한 것처럼 처리해서 정보창 띄우기
        var marker = markerByTempleId[found.templeId];
              if (marker) {
                  kakao.maps.event.trigger(marker, 'click');
              }
        // 지도 중심을 검색된 사찰로 이동 + 좀 더 가깝게 확대
        map.relayout();
        map.setLevel(4);
        map.setCenter(new kakao.maps.LatLng(found.latitude, found.longitude));
    }
    document.getElementById('search-btn').addEventListener('click', runSearch);
    // 입력창에서 엔터키로도 검색되게
    document.getElementById('search-keyword').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            runSearch();
        }
    });

    var favoriteFilterBtn = document.getElementById('filter-favorite');
    favoriteFilterBtn.addEventListener('click', function () {
        if (!isLoggedIn) {
            alert('로그인 후 회원의 즐겨찾기 사찰을 볼 수 있습니다.\n로그인 페이지로 이동합니다.');
            location.href = '/login';
            return; // 필터는 켜지지 않음
        }
        // 필터 바뀌면 열려있던 정보창부터 닫기
        if (currentOpenInfoWindow) {
             currentOpenInfoWindow.close();
             currentOpenInfoWindow = null;
             }
        favoriteFilterBtn.classList.toggle('active');
        applyFilters();
    });

    var typeFieldMap = {
        'data-type-sea': 'supportSea',
        'data-type-mountain': 'supportMountain',
        'data-type-river': 'supportRiver',
        'data-type-urban': 'supportUrban'
    };

    var typeAndEnglishButtons = document.querySelectorAll('#temple-filter-box button, #filter-support-english');

    typeAndEnglishButtons.forEach(function (btn){
        btn.addEventListener('click', function (){
        // 필터 바뀌면 열려있던 정보창부터 닫기
        if (currentOpenInfoWindow) {
             currentOpenInfoWindow.close();
             currentOpenInfoWindow = null;
             }
            btn.classList.toggle('active');
            applyFilters();
        });
    });

    function applyFilters(forceShowList) {

        var activeTypeFields = [];
        document.querySelectorAll('#temple-filter-box button.active').forEach(function (btn){
            var field = typeFieldMap[btn.id];
            if(field) {
                activeTypeFields.push(field);
            }
        });

        var englishRequired = document.getElementById('filter-support-english').classList.contains('active');
        var favoriteRequired = document.getElementById('filter-favorite').classList.contains('active');

        // 필터나 검색 중 하나라도 걸려있는 상태인지 확인
        var anyFilterActive = activeTypeFields.length > 0 || englishRequired || favoriteRequired || searchMatchedIds !== null;

        // 조건을 통과한 사찰들을 담아둘 배열
        var matchedTemples = [];

        templeList.forEach(function (temple){
            var matchType = activeTypeFields.every(function (field) {
                return temple[field];
            });
            var matchEnglish = !englishRequired || temple.supportEnglish;
            var matchFavorite = !favoriteRequired || favoriteTempleIds.indexOf(temple.templeId) !== -1;
            var matchSearch = !searchMatchedIds || searchMatchedIds.indexOf(temple.templeId) !== -1;
            var match = matchType && matchEnglish && matchFavorite && matchSearch;

            var marker = markerByTempleId[temple.templeId]; // ← markerByTempleId에서 찾아옴
                if (marker) {
                    marker.setMap(match ? map : null);
                }
            if (match) {
                matchedTemples.push(temple); // 통과한 사찰은 목록에도 추가
            }
        });
        if (anyFilterActive || forceShowList) {
            showResultList(matchedTemples); // 필터/검색 중이면 목록 패널 갱신 + 열기
        } else {
            resultPanel.classList.add('collapsed'); // 아무 조건도 없으면 목록 패널 접어두기
            updateResultPanelToggle();
        }
    }
    // 지도 전체보기 - 필터/검색 조건은 그대로 두고, 지도 위치만 처음 상태로 되돌림
    document.getElementById('reset-map-btn').addEventListener('click', function () {
        map.setLevel(13);
        map.setCenter(new kakao.maps.LatLng(35.9, 127.7));
    });

    // 두 좌표 사이 거리(km)를 구하는 하버사인 공식
    function getDistanceKm(lat1, lng1, lat2, lng2) {
        var R = 6371; // 지구 반지름(km)
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    var NEAR_ME_RADIUS_KM = 10; // 이 반경(km) 안의 사찰만 "내 주변"으로 취급 - 숫자만 바꾸면 반경 조절 가능
    var myLocationMarker = null;
    var myLocationCircle = null;
    var nearMeActive = false;
    // 내 주변 사찰 - 브라우저 위치 정보를 받아서 반경 안의 사찰만 지도에 남김
    document.getElementById('near-me-btn').addEventListener('click', function() {
        if (nearMeActive) {
            if (myLocationMarker) { myLocationMarker.setMap(null); myLocationMarker = null; }
            if (myLocationCircle) { myLocationCircle.setMap(null); myLocationCircle = null; }
            nearMeActive = false;
            document.getElementById('near-me-btn').classList.remove('active');
            searchMatchedIds = null;
            applyFilters();
            return;
        }

        if (!navigator.geolocation) {
            alert('이 브라우저에서는 위치 확인 기능을 지원하지 않습니다.');
            return;
        }

        showLoading('현재 위치를 확인하는 중...');

        navigator.geolocation.getCurrentPosition(
            function (position) {
                hideLoading();

                var myLat = position.coords.latitude;
                var myLng = position.coords.longitude;
                var myPosition = new kakao.maps.LatLng(myLat, myLng);
                var nearby = templeList.filter(function (temple) {
                    return getDistanceKm(myLat, myLng, temple.latitude, temple.longitude) <= NEAR_ME_RADIUS_KM;
                });
                if (myLocationMarker) myLocationMarker.setMap(null);
                if (myLocationCircle) myLocationCircle.setMap(null);

                var myMarkerImageUrl = 'data:image/svg+xml;base64,' + btoa(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">' +
                         '<circle cx="10" cy="10" r="7" fill="#b0453f" stroke="#fff" stroke-width="3"/>' +
                    '</svg>'
                );
                myLocationMarker = new kakao.maps.Marker({
                    position: myPosition,
                    image: new kakao.maps.MarkerImage(myMarkerImageUrl, new kakao.maps.Size(20, 20), { offset: new kakao.maps.Point(10, 10) }),
                    zIndex: 998
                });
                myLocationMarker.setMap(map);

                myLocationCircle = new kakao.maps.Circle({
                    center: myPosition,
                    radius: NEAR_ME_RADIUS_KM * 1000,
                    strokeWeight: 1,
                    strokeColor: '#b0453f',
                    strokeOpacity: 0.8,
                    strokeStyle: 'shortdash',
                    fillColor: '#b0453f',
                    fillOpacity: 0.1
                });
                myLocationCircle.setMap(map);
                nearMeActive = true;
                document.getElementById('near-me-btn').classList.add('active');

                if (nearby.length === 0) {alert('반경 ' + NEAR_ME_RADIUS_KM + 'km 안에 등록된 사찰이 없습니다.');}
                // 검색 제한 목록에 넣어두면, 기존 applyFilters()가 마커 표시/숨김을 알아서 처리해줌.
                searchMatchedIds = nearby.map(function (temple) { return temple.templeId;});
                applyFilters();

                map.relayout();
                map.setLevel(7);
                map.setCenter(new kakao.maps.LatLng(myLat, myLng));
            },
            function () {
                hideLoading();
                alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 권한을 허용했는지 확인해 주세요.');
            }
        )
    });
    window.refreshFavoriteFilter = applyFilters;
});