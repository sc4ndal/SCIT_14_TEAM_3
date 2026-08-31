// templeStayView.js
// 예약 페이지(#step-1-detail)에 "상세보기"를 눌렀을 때 사찰 위치 지도를 띄운다.
// map-common.js의 createTempleMarker를 그대로 재사용한다.
//
// 사용법: 예약 페이지의 상세보기 클릭 핸들러(reservation.js) 안에서
//         detail 데이터를 다 채운 다음, 마지막에 loadDetailMap(programId) 만 호출하면 됨.
//
// 필요 조건:
//   1) 카카오맵 SDK 스크립트가 이 파일보다 먼저 로드되어 있어야 함
//   2) map-common.js가 이 파일보다 먼저 로드되어 있어야 함
//   3) #step-1-detail 안에 <div id="detail-map"></div> 가 있어야 함

var _detailMap = null; // 지도 객체는 한 번만 만들고 재사용 (다시 만들면 렌더링 깨짐)
var _detailMarker = null;

function loadDetailMap(programId) {
    kakao.maps.load(function () {
        fetch('/api/templestayprograms/' + programId)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('서버 응답 오류: ' + response.status);
                }
                return response.json();
            })
            .then(function (program) {
                var position = new kakao.maps.LatLng(program.latitude, program.longitude);

                if (!_detailMap) {
                    // 최초 1회만 지도 생성
                    _detailMap = new kakao.maps.Map(document.getElementById('detail-map'), {
                        center: position,
                        level: 4
                    });
                } else {
                    // 이미 있으면 중심만 이동
                    _detailMap.setCenter(position);
                    // 카드가 hidden 상태였다가 다시 보일 때 크기 계산이 틀어지는 걸 방지
                    _detailMap.relayout();
                }

                // 이전 마커 제거 후 새로 하나만 찍기
                if (_detailMarker) {
                    _detailMarker.setMap(null);
                }

                _detailMarker = createTempleMarker(_detailMap, {
                    templeId: program.templeId,
                    lat: program.latitude,
                    lng: program.longitude,
                    name: program.templeName,
                    address: program.templeAddress,
                    iconUrl: '/images/temple-marker.svg'
                });
                kakao.maps.event.trigger(_detailMarker, 'click');   // 마커를 만들자마자 클릭한 것처럼 처리
            })
            .catch(function (error) {
                console.error('상세보기 지도 로딩 중 오류 발생:', error);
            });
    });
}


