// templeProgramDetail.js
// 사찰 관리자 - 프로그램 상세보기 화면에서 예약 하나씩 취소/입금확인하는 버튼 처리.
// 상태 뱃지 자체를 span으로 다시 그려서 "취소/입금확인 이후에도 색이 계속 맞게" 유지한다.

function reservationStatusBadgeHtml(status) {
    var label = status === '취소' ? '예약취소' : status; // 템플릿(templeProgramDetail.html)과 동일한 표시 규칙
    return '<span class="status-badge status-' + status + '">' + label + '</span>';
}

document.querySelectorAll('.confirm-reservation-btn').forEach(function (btn) {
    var row = btn.closest('tr');
    var statusCell = btn.closest('.status-cell');
    var reservationId = btn.dataset.reservationId;

    btn.addEventListener('click', function () {
        var ok = confirm('입금을 확인하셨나요? 예약을 확정 처리합니다.');
        if (!ok) return;

        showLoading('예약을 확정 처리하는 중...');
        fetch('/temple/programs/' + PROGRAM_ID + '/reservations/' + reservationId + '/confirm', {
            method: 'PATCH'
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) {
                    throw new Error(err.message || '예약 확정 처리에 실패했습니다.');
                });
            }
            statusCell.innerHTML = reservationStatusBadgeHtml('예약확정');
            row.dataset.status = '예약확정';
            alert('예약이 확정 처리되었습니다.');
        }).catch(function (err) {
            alert(err.message);
        }).finally(function () {
            hideLoading();
        });
    });
});

// 취소 불가능한 경우(이미 취소됨/시작일 지남)는 템플릿(templeProgramDetail.html)이 버튼 자체를
// 안 그려주므로, 여기 있는 버튼들은 전부 "지금 취소 가능한" 예약들뿐이다.
document.querySelectorAll('.cancel-reservation-btn').forEach(function (btn) {
    var row = btn.closest('tr');
    var statusCell = row.querySelector('.status-cell');

    btn.addEventListener('click', function () {
        var ok = confirm('이 예약을 취소하시겠습니까?');
        if (!ok) return;

        var reservationId = btn.dataset.reservationId;

        showLoading('예약을 취소하는 중...');
        fetch('/temple/programs/' + PROGRAM_ID + '/reservations/' + reservationId + '/cancel', {
            method: 'PATCH'
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) {
                    throw new Error(err.message || '예약 취소에 실패했습니다.');
                });
            }
            statusCell.innerHTML = reservationStatusBadgeHtml('취소'); // 입금확인 버튼(있었으면)도 같이 없어짐
            row.dataset.status = '취소';
            btn.remove(); // disabled로 "취소됨" 남겨두는 대신, 새로고침했을 때와 똑같이 버튼 자체를 없앰
            alert('예약이 취소되었습니다.');
        }).catch(function (err) {
            alert(err.message);
        }).finally(function () {
            hideLoading();
        });
    });
});
