kakao.maps.load(function() {
    var container = document.getElementById('map');
    var options = {
        center: new kakao.maps.LatLng(35.1796, 129.0756),
        level: 8
    };
    var map = new kakao.maps.Map(container, options);

    var position = new kakao.maps.LatLng(35.1796, 129.0756);

    var svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <text x="50%" y="50%" font-size="28" text-anchor="middle" dominant-baseline="central">🛕</text>
</svg>`;
    var imageSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    var imageSize = new kakao.maps.Size(40, 40);
    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage
    });
    marker.setMap(map);

    // CustomOverlay로 만든 hover 이름표
    var nameTooltipContent = document.createElement('div');
    nameTooltipContent.style.cssText = 'padding:2px 6px;font-size:11px;font-weight:bold;white-space:nowrap;background:white;border:1px solid #ccc;border-radius:4px;';
    nameTooltipContent.innerText = '범어사';

    var nameTooltip = new kakao.maps.CustomOverlay({
        position: position,
        content: nameTooltipContent,
        yAnchor: 2.2
    });

    // 클릭했을 때 뜨는 상세 정보창
    var infowindow = new kakao.maps.InfoWindow({
        content: `
            <div style="padding:5px;">
                <div style="font-size:15px;font-weight:bold;">범어사</div>
                <div style="font-size:13px;">부산 금정구 범어사로 250</div>
            </div>
        `,
         removable: true
    });

    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });

    // 지도의 빈 곳을 클릭하면 정보창 닫기
    kakao.maps.event.addListener(map, 'click', function() {
        infowindow.close();
    });

    // 마우스 올리면 이름표(CustomOverlay) 보여주기
    kakao.maps.event.addListener(marker, 'mouseover', function() {
        nameTooltip.setMap(map);
    });

    // 마우스 벗어나면 이름표 숨기기
    kakao.maps.event.addListener(marker, 'mouseout', function() {
        nameTooltip.setMap(null);
    });

    // 클릭하면 상세 정보창(InfoWindow) 열기
    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
});