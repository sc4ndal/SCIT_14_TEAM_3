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
let ws = null;
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

function connectWebSocket() {
    try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${location.host}${WS_URL}`);

        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({type: 'JOIN'}));
        });

        ws.addEventListener('message', (event) => {
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
        });

        ws.addEventListener('close', () => {
            participantCountEl.textContent = '실시간 채팅 연결에 문제가 있습니다 (목탁은 계속 칠 수 있어요)';
        });
        ws.addEventListener('error', () => {
            participantCountEl.textContent = '실시간 채팅 연결에 문제가 있습니다 (목탁은 계속 칠 수 있어요)';
        });
    } catch (e) {
        participantCountEl.textContent = '실시간 채팅 연결에 문제가 있습니다 (목탁은 계속 칠 수 있어요)';
    }
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
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: 'LEAVE'}));
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