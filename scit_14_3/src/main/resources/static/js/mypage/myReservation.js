   // ------------------------- 로그인 확인 -------------------------
   const authInfo = document.getElementById('auth-info');
   const isLoggedIn = !!authInfo;
   const currentLoginId = authInfo ? authInfo.dataset.loginId : null;

   if (!isLoggedIn) {
     alert('로그인이 필요합니다.');
     location.href = '/login';
   }

   // ------------------------- 실제 예약 목록 -------------------------
   let RESERVATIONS = [];

   async function loadMyReservations() {
     try {
       // 예약 목록 + 사찰 목록 + 프로그램 목록을 동시에 요청 (서로 기다릴 필요 없으니 Promise.all)
       const [resRes, templesRes, programsRes] = await Promise.all([
         fetch(`/templestayreservations?loginId=${currentLoginId}`),
         fetch('/temples'),
         fetch('/templestayprograms'),
       ]);

       const reservations = await resRes.json();
       const temples = await templesRes.json();
       const programs = await programsRes.json();

       // programId -> program, templeId -> temple 로 빠르게 찾을 수 있게 Map으로 만들어둠
       const templeMap = new Map(temples.map(t => [t.templeId, t]));
       const programMap = new Map(programs.map(p => [p.programId, p]));

       RESERVATIONS = [];

       // 예약 하나하나마다 프로그램 정보 붙이고, 결제 정보도 따로 불러옴
       for (const r of reservations) {
         const program = programMap.get(r.programId);
         const temple = program ? templeMap.get(program.templeId) : null;

         let payment = null;
         try {
           const payRes = await fetch(`/payments/reservation/${r.reservationId}`);
           if (payRes.ok) {
             payment = await payRes.json();
           }
         } catch (err) {
           // 결제 정보 하나 실패해도 이 예약만 "정보 없음"으로 처리하고 나머지는 계속 진행
           console.error(`예약 ${r.reservationId}의 결제 정보를 불러오지 못했습니다.`, err);
         }

         RESERVATIONS.push({
           reservationId: r.reservationId,
           status: r.status,
           startDate: r.startDate,
           endDate: r.endDate,
           participantCount: r.participantCount,
           amount: payment ? payment.amount : null,
           paymentMethod: payment ? payment.paymentMethod : null,
           program: {
             title: program ? program.title : '(정보 없음)',
             templeName: temple ? temple.name : '',
             region: temple ? temple.region : '',
             duration: program ? program.duration : '',
             price: program ? program.price : 0,
             description: program ? program.description : '',
           },
         });
       }

       renderList();
     } catch (err) {
       console.error('예약 목록을 불러오지 못했습니다.', err);
       alert('예약 목록을 불러오는 중 오류가 발생했습니다.');
     }
   }
  let selectedReservationId = null;

  function renderList() {
    const listEl = document.getElementById('reservation-list');
    document.getElementById('count-label').textContent = RESERVATIONS.length;

    if (RESERVATIONS.length === 0) {
      listEl.innerHTML = '<p class="empty-msg">아직 예약한 템플스테이가 없습니다.</p>';
      return;
    }

    listEl.innerHTML = RESERVATIONS.map(r => `
      <article class="reservation-card" data-id="${r.reservationId}">
        <div class="info">
          <h3>${r.program.title}</h3>
          <p>${r.program.templeName} · ${r.program.region}</p>
        </div>
        <div class="meta">
          <div class="date">${r.startDate}${r.startDate !== r.endDate ? ' ~ ' + r.endDate : ''}</div>
          <span class="status-badge status-${r.status}">${r.status}</span>
        </div>
      </article>
    `).join('');

    listEl.querySelectorAll('.reservation-card').forEach(card => {
      card.addEventListener('click', () => showDetail(Number(card.dataset.id)));
    });
  }

  function showDetail(reservationId) {
    const r = RESERVATIONS.find(x => x.reservationId === reservationId);
    if (!r) return;
    selectedReservationId = reservationId;

    document.getElementById('list-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';

    document.getElementById('detail-status-badge').textContent = r.status;
    document.getElementById('detail-status-badge').className = `status-badge status-${r.status}`;
    document.getElementById('detail-title').textContent = r.program.title;
    document.getElementById('detail-temple-region').textContent = `${r.program.templeName} · ${r.program.region}`;

    document.getElementById('detail-duration').textContent = r.program.duration;
    document.getElementById('detail-price').textContent = `${r.program.price.toLocaleString()}원`;
    document.getElementById('detail-description').textContent = r.program.description;

    document.getElementById('detail-reservation-id').textContent = `#${r.reservationId}`;
    document.getElementById('detail-date-range').textContent =
      r.startDate === r.endDate ? `${r.startDate} (당일)` : `${r.startDate} ~ ${r.endDate}`;
    document.getElementById('detail-participant-count').textContent = `${r.participantCount}명`;
    document.getElementById('detail-amount').textContent = r.amount != null ? `${r.amount.toLocaleString()}원` : '결제 정보 없음';
    document.getElementById('detail-payment-method').textContent = r.paymentMethod || '-';

    // 취소 버튼: 이미 취소됐거나 이용완료된 예약은 다시 취소할 수 없게 막음
    const cancelBtn = document.getElementById('cancel-btn');
    const cancelNote = document.getElementById('cancel-note');
    if (r.status === '취소' || r.status === '이용완료') {
      cancelBtn.disabled = true;
      cancelNote.textContent = r.status === '취소' ? '이미 취소된 예약입니다.' : '이용이 완료된 예약은 취소할 수 없습니다.';
    } else {
      cancelBtn.disabled = false;
      cancelNote.textContent = '';
    }
  }

  document.getElementById('back-to-list-btn').addEventListener('click', () => {
    document.getElementById('detail-view').style.display = 'none';
    document.getElementById('list-view').style.display = 'block';
  });

   document.getElementById('cancel-btn').addEventListener('click', async () => {
     const ok = confirm('정말 이 예약을 취소하시겠습니까?');
     if (!ok) return;

     try {
        const res = await fetch(`/templestayreservations/${selectedReservationId}/cancel`, {
            method: 'PATCH',
        });

        if(!res.ok) {
        throw new Error('취소 요청 실패');
        }
        const updated = await res.json();
        const r = RESERVATIONS.find(x => x.reservationId === updated.reservationId);
        if (r) r.status = updated.status;

        alert('예약이 취소되었습니다.');
        showDetail(selectedReservationId);
        renderList();
        } catch (err) {
        alert('예약 취소 중 오류가 발생했습니다.');
        console.error(err);
     }
  });
  loadMyReservations();