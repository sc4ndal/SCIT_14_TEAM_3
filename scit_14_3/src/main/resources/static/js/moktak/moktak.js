const IMAGE_URLS = {
    basic: {cushion: IMAGE_BASE + '/basicCushion.png', body: IMAGE_BASE + '/basicBody.png'},
    heart: {cushion: IMAGE_BASE + '/heartCushion.png', body: IMAGE_BASE + '/heartBody.png'},
    cat: {cushion: IMAGE_BASE + '/catCushion.png', body: IMAGE_BASE + '/catBody.png'},
};

const LAYOUT = {
    basic: {cushion: {left: 24.8, top: 53.6, width: 51.3}, body: {left: 35.4, top: 41.8, width: 43.0}},
    heart: {cushion: {left: 24.9, top: 56.7, width: 49.9}, body: {left: 34.0, top: 41.2, width: 38.2}},
    cat: {cushion: {left: 22.8, top: 59.4, width: 49.4}, body: {left: 31.8, top: 40.3, width: 36.0}},
};
const ORDER = ["basic", "heart", "cat"];
const LABELS = {basic: "기본", heart: "하트", cat: "고양이"};

const cushion = document.getElementById('cushion');
const body = document.getElementById('moktak-body');
const stage = document.getElementById('stage');
const stageWrap = document.getElementById('stageWrap');
const designLabel = document.getElementById('designLabel');
const dotsEl = document.getElementById('dots');
const hitCountEl = document.getElementById('hit-count');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const participantCountEl = document.getElementById('participantCount');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const resetBtn = document.getElementById('resetBtn');
const infoBtn = document.getElementById('infoBtn');
const infoPopover = document.getElementById('infoPopover');
const chatFlow = document.getElementById('chatFlow');
const chatInput = document.getElementById('chatInput');
const soundSelectWrap = document.getElementById('soundSelectWrap');
const soundSelectBtn = document.getElementById('soundSelectBtn');
const soundSelectLabel = document.getElementById('soundSelectLabel');
const soundSelectList = document.getElementById('soundSelectList');
const soundOptions = Array.from(soundSelectList.children);


let currentIndex = 0;
let transitioning = false;
let idleT = 0;
let punching = false;
let soundOn = true;

// ---- 오늘의 목탁 카운터 (localStorage, 날짜 바뀌면 자동 0부터) ----
const todayKey = () => 'moktak_count_' + new Date().toISOString().slice(0, 10);
let hitCount = parseInt(localStorage.getItem(todayKey()) || '0', 10);
hitCountEl.textContent = hitCount;

function saveHitCount() {
    localStorage.setItem(todayKey(), String(hitCount));
}

// ---- idle 흔들림 + 타격 애니메이션 ----
function idleSwayDeg() {
    return Math.sin(idleT * 0.6) * 2.0;
}

function applyIdleTransform() {
    if (!punching) body.style.transform = `rotate(${idleSwayDeg()}deg)`;
}

function applyDesign(index) {
    const key = ORDER[index];
    const cfg = LAYOUT[key];
    cushion.src = IMAGE_URLS[key].cushion;
    body.src = IMAGE_URLS[key].body;
    cushion.style.left = cfg.cushion.left + '%';
    cushion.style.top = cfg.cushion.top + '%';
    cushion.style.width = cfg.cushion.width + '%';
    body.style.left = cfg.body.left + '%';
    body.style.top = cfg.body.top + '%';
    body.style.width = cfg.body.width + '%';
    designLabel.textContent = LABELS[key];
    Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === index));
    applyIdleTransform();
}

function buildDots() {
    dotsEl.innerHTML = '';
    ORDER.forEach((key, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.setAttribute('aria-label', LABELS[key] + ' 디자인');
        b.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(b);
    });
}

function goTo(newIndex) {
    if (transitioning || newIndex === currentIndex) return;
    const dir = newIndex > currentIndex ? 'next' : 'prev';
    transitioning = true;
    stage.classList.add(dir === 'next' ? 'leaving-left' : 'leaving-right');
    setTimeout(() => {
        currentIndex = newIndex;
        applyDesign(currentIndex);
        stage.classList.remove('leaving-left', 'leaving-right');
        stage.classList.add('no-transition', dir === 'next' ? 'leaving-right' : 'leaving-left');
        void stage.offsetWidth;
        stage.classList.remove('no-transition');
        requestAnimationFrame(() => {
            stage.classList.remove('leaving-left', 'leaving-right');
            setTimeout(() => {
                transitioning = false;
            }, 200);
        });
    }, 190);
}

function nextDesign() {
    goTo((currentIndex + 1) % ORDER.length);
}

function prevDesign() {
    goTo((currentIndex - 1 + ORDER.length) % ORDER.length);
}

prevBtn.addEventListener('click', prevDesign);
nextBtn.addEventListener('click', nextDesign);

// ---- 스와이프(드래그) ----
let dragging = false, dragStartX = 0, dragDeltaX = 0, justSwiped = false;
stageWrap.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragDeltaX = 0;
});
window.addEventListener('pointermove', (e) => {
    if (dragging) dragDeltaX = e.clientX - dragStartX;
});
window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dragDeltaX) > 40) {
        justSwiped = true;
        if (dragDeltaX < 0) nextDesign(); else prevDesign();
        setTimeout(() => {
            justSwiped = false;
        }, 60);
    }
});

// ---- 클릭(타격) + 사운드 ----
const SOUND_KEY = 'moktak_sound_choice';
let soundIndex = parseInt(localStorage.getItem(SOUND_KEY) || '0', 10);
if (isNaN(soundIndex) || soundIndex < 0 || soundIndex >= SOUND_URLS.length) soundIndex = 0;

function updateSoundSelectUI() {
    soundOptions.forEach((li, i) => li.classList.toggle('active', i === soundIndex));
    soundSelectLabel.textContent = soundOptions[soundIndex].textContent;
}

updateSoundSelectUI();

soundSelectBtn.addEventListener('click', () => {
    const isOpen = soundSelectWrap.classList.toggle('open');
    soundSelectList.hidden = !isOpen;
    soundSelectBtn.setAttribute('aria-expanded', String(isOpen));
});

soundOptions.forEach((li, i) => {
    li.addEventListener('click', () => {
        soundIndex = i;
        localStorage.setItem(SOUND_KEY, String(soundIndex));
        updateSoundSelectUI();
        soundSelectWrap.classList.remove('open');
        soundSelectList.hidden = true;
    });
});

document.addEventListener('click', (e) => {
    if (!soundSelectWrap.contains(e.target)) {
        soundSelectWrap.classList.remove('open');
        soundSelectList.hidden = true;
    }
});

function playHitSound() {
    if (!soundOn) return;
    try {
        const src = SOUND_URLS[soundIndex];
        const a = new Audio(src);
        a.volume = 0.85;
        a.play().catch(() => {
        });
    } catch (e) {
    }
}

function strike() {
    if (justSwiped) return;
    hitCount++;
    hitCountEl.textContent = hitCount;
    saveHitCount();
    playHitSound();
    sendHit();
    punching = true;
    const start = performance.now();
    const duration = 130;

    function animate(now) {
        const elapsed = now - start;
        if (elapsed < duration) {
            const p = elapsed / duration;
            const s = 1 - Math.sin(p * Math.PI) * 0.09;
            body.style.transform = `scale(${s}, ${s * 1.02}) rotate(${idleSwayDeg()}deg)`;
            requestAnimationFrame(animate);
        } else {
            punching = false;
            applyIdleTransform();
        }
    }

    requestAnimationFrame(animate);
}

body.addEventListener('click', strike);

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextDesign();
    else if (e.key === 'ArrowLeft') prevDesign();
});

function tick() {
    requestAnimationFrame(tick);
    idleT += 0.016;
    applyIdleTransform();
}

// ---- 소리 ON/OFF, 초기화, 108 설명 팝오버 ----
soundToggleBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundToggleBtn.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
});
resetBtn.addEventListener('click', () => {
    hitCount = 0;
    hitCountEl.textContent = 0;
    saveHitCount();
});
infoBtn.addEventListener('click', () => {
    infoPopover.hidden = !infoPopover.hidden;
});

// ---- WebSocket: 참여자 수 + 흘러가는 채팅 ----
// ⚠ 이 부분은 2026-09-09에 만들어둔 MoktakWebSocketHandler의 실제 메시지 스키마와
//    필드명이 정확히 일치하는지 슌이 백엔드 코드 보면서 확인/조정 필요.
//    아래는 JOIN/CHAT/LEAVE 스키마 기준으로 짠 가정 버전.
// 현재 WebSocket 연결 객체. 끊기면 새 객체를 만들어서 같은 변수에 다시 넣는다(재연결).
let ws = null;

// ---- 재연결 / 하트비트 설정 ----
// 재연결: 연결이 끊기면 자동으로 다시 붙는다. 서버가 죽어 있을 때 접속자들이 동시에 초당 수십 번
//        재시도하면 서버를 더 괴롭히므로, 대기 시간을 1초 -> 2초 -> 4초 ... 최대 30초까지 늘린다(지수 백오프).
const WS_RECONNECT_INITIAL_MS = 1000;   // 첫 재시도까지 기다리는 시간
const WS_RECONNECT_MAX_MS = 30000;      // 재시도 간격의 상한
// 하트비트: 조용한 연결이 중간 장비(Nginx 등)에게 "무활동"으로 판단돼 끊기지 않도록,
//          주기적으로 PING을 보내고 서버가 PONG으로 답하게 한다. 이 왕복이 있어야 Nginx의
//          proxy_read_timeout(서버 -> 브라우저 방향 무활동 시간)도 계속 리셋된다.
const WS_HEARTBEAT_MS = 25000;          // PING 보내는 주기(Nginx 기본 타임아웃 60초보다 짧게)
const WS_PONG_TIMEOUT_MS = 10000;       // PING 후 이 시간 안에 아무 응답이 없으면 "죽은 연결"로 판단

let wsReconnectDelay = WS_RECONNECT_INITIAL_MS; // 다음 재시도까지 대기할 시간(실패할 때마다 2배로 늘어남)
let wsReconnectTimer = null;   // 예약된 재연결 타이머(중복 예약 방지용)
let wsHeartbeatTimer = null;   // 25초마다 PING을 보내는 반복 타이머
let wsPongTimer = null;        // PING을 보낸 뒤 응답을 기다리는 타이머
let wsManualClose = false;     // true면 사용자가 페이지를 떠나는 중이라 재연결하지 않는다

let flowLane = 0;
const FLOW_LANES = 5;

function addFlowingMessage(text) {
    const el = document.createElement('div');
    el.className = 'flow-msg';
    el.textContent = text;
    const laneHeight = 100 / FLOW_LANES;
    el.style.top = (flowLane % FLOW_LANES) * laneHeight + laneHeight / 2 + '%';
    flowLane++;
    chatFlow.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

const WS_DOWN_TEXT = '실시간 채팅 연결에 문제가 있습니다 (목탁은 계속 칠 수 있어요)';
const WS_RECONNECTING_TEXT = '연결이 끊겼어요. 다시 연결하는 중입니다... (목탁은 계속 칠 수 있어요)';

/** 서버에 WebSocket으로 연결한다. 처음 접속할 때와 끊긴 뒤 재연결할 때 모두 이 함수를 쓴다. */
function connectWebSocket() {
    // 페이지를 떠나는 중이면 연결하지 않는다
    if (wsManualClose) return;
    // 이미 연결 중이거나 연결돼 있으면 또 만들지 않는다(중복 연결 방지 - 참여자 수가 부풀려지는 걸 막음)
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

    let socket;
    try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${proto}//${location.host}${WS_URL}`);
    } catch (e) {
        // 주소 오류 등으로 객체 생성 자체가 실패한 경우에도 재시도 예약
        participantCountEl.textContent = WS_DOWN_TEXT;
        scheduleReconnect();
        return;
    }
    ws = socket;

    // 아래 이벤트 핸들러들은 "이 연결(socket)이 아직 현재 연결(ws)일 때만" 동작한다.
    // 죽은 연결을 버리고 새로 붙은 뒤에, 옛 연결의 늦은 이벤트가 뒤늦게 도착해서 상태를 꼬이게 하는 걸 막는다.
    socket.addEventListener('open', () => {
        if (ws !== socket) return;
        wsReconnectDelay = WS_RECONNECT_INITIAL_MS; // 연결에 성공했으니 재시도 대기 시간을 처음으로 되돌림
        socket.send(JSON.stringify({type: 'JOIN'}));
        startHeartbeat();
    });

    socket.addEventListener('message', (event) => {
        if (ws !== socket) return;
        // 서버에서 뭐라도 도착했다면 연결이 살아있다는 증거이므로 PONG 대기 타이머를 해제한다
        clearTimeout(wsPongTimer);

        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            return;
        }
        if (msg.type === 'CHAT' && msg.text) {
            addFlowingMessage(msg.text);
        } else if (typeof msg.participantCount === 'number') {
            participantCountEl.textContent = `🟢 현재 ${msg.participantCount}명이 함께 수행 중입니다`;
        }
        // type이 'PONG'인 하트비트 응답은 위 두 조건에 안 걸려서 화면엔 아무 영향이 없다
    });

    socket.addEventListener('close', () => {
        if (ws !== socket) return;
        stopHeartbeat();
        participantCountEl.textContent = WS_RECONNECTING_TEXT;
        scheduleReconnect();
    });

    socket.addEventListener('error', () => {
        if (ws !== socket) return;
        // error 뒤에는 브라우저가 항상 close 이벤트를 이어서 발생시키므로,
        // 재연결 예약은 close 쪽에서만 한다(여기서도 하면 중복 예약이 됨). 문구만 바꿔둔다.
        participantCountEl.textContent = WS_DOWN_TEXT;
    });
}

/** 잠시 뒤에 다시 연결하도록 예약한다. 실패가 이어질수록 대기 시간이 2배씩 늘어난다(최대 30초). */
function scheduleReconnect() {
    // 사용자가 떠나는 중이거나 이미 예약된 재연결이 있으면 또 예약하지 않는다
    if (wsManualClose || wsReconnectTimer) return;

    // 0~0.5초의 무작위 값을 더해서, 서버가 재시작됐을 때 모든 접속자가 정확히 같은 순간에
    // 몰려들지 않게 분산시킨다(jitter)
    const delay = wsReconnectDelay + Math.random() * 500;
    wsReconnectTimer = setTimeout(() => {
        wsReconnectTimer = null;
        connectWebSocket();
    }, delay);
    wsReconnectDelay = Math.min(wsReconnectDelay * 2, WS_RECONNECT_MAX_MS);
}

/** 예약된 대기를 건너뛰고 지금 바로 다시 연결한다(탭에 돌아왔을 때, 인터넷이 다시 연결됐을 때). */
function reconnectNow() {
    if (wsManualClose) return;
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
    wsReconnectDelay = WS_RECONNECT_INITIAL_MS;
    connectWebSocket();
}

/** 25초마다 PING을 보내서 연결을 유지하고, 응답이 없으면 죽은 연결로 보고 재연결한다. */
function startHeartbeat() {
    stopHeartbeat(); // 혹시 남아 있는 이전 타이머가 있으면 정리(중복 방지)
    wsHeartbeatTimer = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({type: 'PING'}));

        // PING을 보낸 뒤 10초 안에 서버에서 아무 메시지도 안 오면 연결이 끊어진 것으로 본다.
        // (와이파이가 조용히 끊기는 경우 브라우저가 close 이벤트를 한참 뒤에야 주기 때문에
        //  이렇게 직접 감지해야 빨리 복구된다)
        clearTimeout(wsPongTimer);
        wsPongTimer = setTimeout(() => {
            const dead = ws;
            ws = null;              // 옛 연결의 이벤트가 더 이상 상태를 건드리지 못하게 분리
            stopHeartbeat();
            try { dead && dead.close(); } catch (e) { /* 이미 닫혀 있어도 무방 */ }
            participantCountEl.textContent = WS_RECONNECTING_TEXT;
            scheduleReconnect();
        }, WS_PONG_TIMEOUT_MS);
    }, WS_HEARTBEAT_MS);
}

/** 하트비트와 응답 대기 타이머를 모두 멈춘다(연결이 닫혔을 때 호출). */
function stopHeartbeat() {
    clearInterval(wsHeartbeatTimer);
    clearTimeout(wsPongTimer);
    wsHeartbeatTimer = null;
    wsPongTimer = null;
}

function sendHit() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: 'HIT'}));
    }
}

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: 'CHAT', text: chatInput.value.trim()}));
        }
        chatInput.value = '';
    }
});

window.addEventListener('beforeunload', () => {
    // 사용자가 페이지를 떠나는 중이므로 이후에 close 이벤트가 와도 재연결하지 않는다
    wsManualClose = true;
    clearTimeout(wsReconnectTimer);
    stopHeartbeat();
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: 'LEAVE'}));
    }
});

// 브라우저는 백그라운드 탭의 타이머를 늦추거나 재워서, 그 사이에 연결이 끊겨도 재연결 타이머가
// 제때 안 돌 수 있다. 탭으로 돌아온 순간에 연결이 끊겨 있으면 기다리지 않고 바로 다시 붙는다.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!ws || ws.readyState > WebSocket.OPEN)) {
        reconnectNow();
    }
});

// 인터넷이 끊겼다 다시 연결되면(와이파이 전환 등) 바로 재연결한다
window.addEventListener('online', () => {
    if (!ws || ws.readyState > WebSocket.OPEN) reconnectNow();
});

// 뒤로가기/앞으로가기로 돌아올 때 브라우저가 페이지를 통째로 복원(bfcache)하면 스크립트가 다시
// 실행되지 않고 연결도 죽어 있다. beforeunload에서 켜둔 "떠나는 중" 표시를 풀고 다시 연결한다.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        wsManualClose = false;
        reconnectNow();
    }
});

buildDots();
applyDesign(currentIndex);
tick();
connectWebSocket();
function preloadImages() {
    Object.values(IMAGE_URLS).forEach(({cushion, body}) => {
        [cushion, body].forEach(src => {
            new Image().src = src;
        });
    });
}
// 페이지 필수 리소스(JS/CSS/첫 디자인 이미지)가 다 뜬 뒤에 나머지 이미지를 백그라운드로 받는다 -
// 곧바로 실행하면 초기 로딩 요청들이랑 동시 연결(브라우저는 한 사이트당 최대 6개)을 두고
// 경쟁해서 오히려 더 늦게 도착하는 역효과가 있었다.
window.addEventListener('load', preloadImages);