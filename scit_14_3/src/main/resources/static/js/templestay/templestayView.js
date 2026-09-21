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

var _detailMapState = { map: null, marker: null };

function loadDetailMap(program) {
    loadTempleDetailMap('detail-map', program, _detailMapState);
}

