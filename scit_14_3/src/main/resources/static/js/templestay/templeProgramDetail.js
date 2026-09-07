// templeProgramDetail.js
// 사찰 관리자 - 프로그램 상세보기 화면에서 예약 하나씩 취소하는 버튼 처리.

document.querySelectorAll('.cancel-reservation-btn').forEach(function (btn) {
    var row = btn.closest('tr');
    var statusCell = row.querySelector('.status-cell');

    // 이미 취소된 예약은 처음부터 버튼을 막아둔다
    if (statusCell.textContent.trim() === '취소') {
        btn.disabled = true;
        btn.textContent = '취소됨';
    }

    btn.addEventListener('click', function () {
        var ok = confirm('이 예약을 취소하시겠습니까?');
        if (!ok) return;

        var reservationId = btn.dataset.reservationId;

        fetch('/temple/programs/' + PROGRAM_ID + '/reservations/' + reservationId + '/cancel', {
            method: 'PATCH'
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) {
                    throw new Error(err.message || '예약 취소에 실패했습니다.');
                });
            }
            statusCell.textContent = '취소';
            btn.disabled = true;
            btn.textContent = '취소됨';
            alert('예약이 취소되었습니다.');
        }).catch(function (err) {
            alert(err.message);
        });
    });
});
