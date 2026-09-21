// templeStayView.js
// 예약 페이지(#step-1-detail)에 "상세보기"를 눌렀을 때 사찰 위치 지도를 띄운다.
// map-common.js의 createTempleMarker를 그대로 재사용한다.
//
// 사용법: 호출하는 쪽(programDetail.js)이 이미 조회해둔 program 객체를 그대로 넘겨서
//         loadDetailMap(program) 만 호출하면 됨 - 같은 프로그램을 여기서 또 fetch하지 않음.
//
// 필요 조건:
//   1) 카카오맵 SDK 스크립트가 이 파일보다 먼저 로드되어 있어야 함
//   2) map-common.js가 이 파일보다 먼저 로드되어 있어야 함
//   3) #step-1-detail 안에 <div id="detail-map"></div> 가 있어야 함

var _detailMap = null; // 지도 객체는 한 번만 만들고 재사용 (다시 만들면 렌더링 깨짐)
var _detailMarker = null;

function loadDetailMap(program) {
    kakao.maps.load(function () {
        var position = new kakao.maps.LatLng(program.latitude, program.longitude);

                if (!_detailMap) {
                    // 최초 1회만 지도 생성
                    _detailMap = new kakao.maps.Map(document.getElementById('detail-map'), {
                        center: position,
                        level: 4
                    });
                }

                // 카드가 hidden 상태였다가 보이는 시점일 수 있으므로, 최초 생성/재사용 둘 다
                // relayout으로 크기를 다시 계산한 다음 중심을 맞춘다 (순서 중요: relayout 먼저)
                _detailMap.relayout();
                _detailMap.setCenter(position);

                // 이전 마커 제거 후 새로 하나만 찍기
                if (_detailMarker) {
                    _detailMarker.setMap(null);
                }

                // 지도를 막 만들거나 relayout한 직후라 카카오 내부 좌표 계산이 아직
                // 안 끝났을 수 있어서, 한 프레임 뒤로 미뤄서 마커/정보창을 연다.
                setTimeout(function () {
                    _detailMarker = createTempleMarker(_detailMap, {
                        templeId: program.templeId,
                        lat: program.latitude,
                        lng: program.longitude,
                        name: program.templeName,
                        address: program.templeAddress,
                        autoPan: true
                    });
                    kakao.maps.event.trigger(_detailMarker, 'click');   // 마커를 만들자마자 클릭한 것처럼 처리
                }, 0);
            });
        }


