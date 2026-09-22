/* =========================================================================
   1. SCENE DATA
========================================================================= */
const SCENES = {

    prologue: {
        type: 'story', bg: '집', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B0%A9.png', bgm: 'room',
        lines: [
            '오랜만에 마음이 복잡했다.',
            '누가 그러던데, 이럴 땐 절에 가서 마음을 좀 가라앉히고 오는 것도 나쁘지 않다고.',
            '그래서, 처음으로— 절에 가보기로 했다.'
        ],
        next: 'scene01'
    },

    scene01: {
        type: 'choice', bg: '집 · 옷장 앞', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B0%A9.png', bgm: 'room', judged: true,
        resultId: { no: '01', title: '사찰 방문 준비' },
        lines: ['그러고 보니 절에 갈 때는 뭘 입어야 하지? 그냥 평소처럼 입고 가도 되나......?'],
        choices: [
            { id: 1, label: '단정하고 편한 옷을 입는다.', correct: true, next: 'scene02',
                after: ['많이 걷게 될 수도 있으니까 편한 게 좋겠지.', '이 정도면 괜찮겠다.'] },
            { id: 2, label: '이왕 나가는 거, 클럽 갈 때 아껴둔 옷을 꺼낸다.', correct: false, next: 'scene02',
                after: ['아껴둔 보람이 있네.', '......절에 가는 거긴 하지만.'] }
        ]
    },

    scene02: {
        type: 'story', bg: '사찰 입구 → 경내', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844159/%EB%B6%88%EC%84%A0%EC%82%AC_%EC%95%9E.png', bgm: 'room',
        lines: [
            '얼마 후, 사찰에 도착했다. 생각했던 것보다 조용했다.',
            '바깥에서 들리던 소리도 어느새 멀어지고, 가끔 바람에 나뭇잎이 흔들리는 소리만 들려왔다.',
            '나: 여기가 절이구나....... 생각보다 조용하네. 일단 안으로 들어가 볼까.'
        ],
        next: 'scene03'
    },

    scene03: {
        type: 'choice', bg: '법당 정면 (문 3개)', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B2%95%EB%8B%B9%EC%A0%95%EB%A9%B4.png', bgm: 'temple', judged: true,
        resultId: { no: '02', title: '법당 출입' },
        lines: [
            '경내를 둘러보다 법당 앞에 도착했다. 막상 들어가려니 문이 하나가 아니었다.',
            '정면 중앙에도 문이 있고, 그 양옆에도 출입할 수 있는 문이 보였다.',
            '나: ......문이 여러 개네. 어디로 들어가야 하지?'
        ],
        choices: [
            { id: 1, label: '왼쪽 문으로 들어간다.', correct: true, next: 'scene04' },
            { id: 2, label: '정면 중앙 문으로 들어간다.', correct: false, next: 'scene04' },
            { id: 3, label: '오른쪽 문으로 들어간다.', correct: true, next: 'scene04' }
        ]
    },

    scene04: {
        type: 'choice', bg: '법당 내부 · 불상', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B2%95%EB%8B%B9_%EB%82%B4%EB%B6%80.png', bgm: 'temple', judged: true,
        resultId: { no: '03', title: '법당에서의 인사' },
        lines: [
            '법당 안으로 들어서자 분위기가 한층 더 조용해졌다. 정면에는 불상이 모셔져 있었고,',
            '안에서는 몇몇 사람들이 조용히 참배하고 있었다.',
            '나: 아....... 들어오긴 했는데, 이런 곳에서는 어떻게 인사해야 하지?'
        ],
        choices: [
            { id: 1, label: '불상을 향해 합장하고 가볍게 반배한다.', correct: true, next: 'scene05' },
            { id: 2, label: '불상을 향해 고개만 살짝 숙인다.', correct: false, next: 'scene05' },
            { id: 3, label: '일단 아무것도 하지 않고 안으로 들어간다.', correct: false, next: 'scene05' }
        ]
    },

    scene05: {
        type: 'choice', bg: '법당 내부 · 초와 향', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844159/%EC%B4%88_%ED%96%A5%EB%A1%9C.png', bgm: 'temple', judged: true,
        resultId: { no: '04', title: '초와 향' },
        lines: [
            '인사를 마치고 주변을 둘러보던 중, 한쪽에 놓인 초와 향이 눈에 들어왔다.',
            '가까이 가보니 이미 누군가 켜둔 초가 타고 있었다.',
            '나: 나도 하나 켜볼까......? 그런데 놓을 자리가 별로 없네.'
        ],
        choices: [
            { id: 1, label: '이미 켜져 있는 초는 그대로 두고 빈자리를 찾는다.', correct: true, next: 'scene06' },
            { id: 2, label: '켜져 있는 초 하나를 빼고 내 초를 놓는다.', correct: false, next: 'scene06' },
            { id: 3, label: '자리가 없으니 켜져 있는 초를 전부 꺼버린다.', correct: false, next: 'scene06' }
        ]
    },

    scene06: {
        type: 'choice', bg: '법당 내부 · 불상 앞', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B2%95%EB%8B%B9_%EB%82%B4%EB%B6%80.png', bgm: 'temple', judged: true,
        resultId: { no: '05', title: '참배하기' },
        lines: [
            '초와 향이 놓인 곳을 지나 불상 앞쪽으로 향했다. 주변에서는 사람들이 조용히 절을 올리고 있었다.',
            '나: 나도 여기까지 왔으니까 제대로 인사를 드리고 가야겠지. ......잠깐. 절은 몇 번 해야 하지?'
        ],
        choices: [
            { id: 1, label: '불상을 향해 한 번 절한다.', correct: false, next: 'scene07' },
            { id: 2, label: '불상을 향해 세 번 절한다.', correct: true, next: 'scene07' },
            { id: 3, label: '많이 할수록 좋겠지. 계속 절한다.', correct: false, next: 'scene07',
                after: ['(여섯 번이 넘도록 절을 계속한다......)', '나: ......어? 나 몇 번 했더라?'] }
        ]
    },

    scene07: {
        type: 'choice', bg: '법당 내부 · 다른 참배객', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EB%B2%95%EB%8B%B9_%EB%82%B4%EB%B6%80.png', bgm: 'temple', judged: true,
        resultId: { no: '06', title: '다른 참배객 배려하기' },
        lines: [
            '참배를 마치고 자리에서 일어났다. 이제 밖으로 나가려던 순간,',
            '앞쪽에서 한 사람이 절을 하고 있는 것이 보였다. 마침 내가 나가려는 방향과 겹쳐 있었다.'
        ],
        choices: [
            { id: 1, label: '절하고 있는 사람의 뒤쪽으로 돌아간다.', correct: true, next: 'scene08' },
            { id: 2, label: '방해되지 않게 조용히 앞을 지나간다.', correct: false, next: 'scene08' }
        ]
    },

    scene08: {
        type: 'choice', bg: '사찰 경내 · 스님과 마주침', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788856122/%EC%8A%A4%EB%8B%98%EB%93%B1%EC%9E%A5.png', bgm: 'temple', judged: true,
        resultId: { no: '07', title: '스님께 인사하기' },
        lines: [
            '법당을 나와 경내를 천천히 걸었다. 처음 들어올 때보다는 조금 긴장이 풀린 것 같았다.',
            '그때, 맞은편에서 스님 한 분이 걸어오는 것이 보였다.',
            '나: ......스님이다. 그냥 지나가도 되나? 아니면 인사를 드려야 하나......?'
        ],
        choices: [
            { id: 1, label: '두 손을 모아 합장하고 가볍게 반배한다.', correct: true, next: 'scene09' },
            { id: 2, label: '평소처럼 허리를 숙여 인사한다.', correct: false, next: 'scene09',
                after: ['스님: 안녕하세요.', '나: ......네.'] }
        ]
    },

    scene09: {
        type: 'choice', bg: '사찰 공양간', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844158/%EA%B3%B5%EC%96%91%EA%B0%84.png', bgm: 'temple', judged: true,
        resultId: { no: '08', title: '공양하기' },
        lines: [
            '경내를 둘러보다 보니 어느새 시간이 꽤 흘렀다. 마침 공양 시간이 되어 공양간으로 향했다.',
            '안에서는 사람들이 조용히 식사를 하고 있었다. 생각보다 여러 가지 음식이 준비되어 있었다.',
            '나: 오, 맛있어 보인다. 얼마나 담을까?'
        ],
        choices: [
            { id: 1, label: '먹을 수 있을 만큼만 담는다.', correct: true, next: 'HIDDEN_CHECK' },
            { id: 2, label: '배고프니까 일단 넉넉하게 담는다.', correct: false, next: 'HIDDEN_CHECK' }
        ]
    },

    scene10: {
        type: 'story', bg: '사찰 경내 · 노을', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844159/%EA%B2%BD%EB%82%B4_%EB%82%AE.png', bgm: 'temple',
        lines: [
            '공양을 마치고 밖으로 나오니 어느새 시간이 꽤 지나 있었다.',
            '처음 들어왔을 때보다 경내가 조금 익숙하게 느껴졌다.',
            '나: 벌써 갈 시간이네. ......처음이라 제대로 한 건지는 잘 모르겠지만....... 그래도 오길 잘한 것 같다.',
            '(바람이 불자 풍경 소리) 나: 아까보다는 조금 괜찮아진 것 같아.'
        ],
        next: 'ENDING'
    },

    hidden1: {
        type: 'choice', bg: '사찰 경내 · 마루 밑 고양이', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788856120/%EB%A7%88%EB%A3%A8%EB%B0%91%EA%B3%A0%EC%96%91%EC%9D%B4.png', bgm: 'hidden',
        lines: [
            '공양을 마치고 밖으로 나왔다. 슬슬 돌아갈까 생각하며 입구 쪽으로 걷던 중—',
            '고양이: 야옹.',
            '나: ......응? (마루 아래에서 고양이 한 마리가 고개를 내밀고 있었다.)'
        ],
        choices: [
            { id: 1, label: '가까이 가서 만져본다.', correct: null, next: 'scene10',
                after: ['(고양이가 놀라서 도망갔다.)'] },
            { id: 2, label: '놀라지 않게 가만히 바라본다.', correct: null, next: 'hidden2' }
        ]
    },

    hidden2: {
        type: 'choice', bg: '사찰 경내 · 앞장서는 고양이', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788856122/%EC%84%B9%EC%8B%9C%ED%95%9C%EC%82%BC%EC%83%89%EC%9D%B4%EB%92%B7%ED%83%9C.png', bgm: 'hidden',
        lines: [
            '고양이가 슬금슬금 다가오더니, 몇 걸음 앞장서 걷기 시작했다.',
            '몇 걸음 걷다 멈춰서 뒤돌아보길 반복한다. 나: ......따라오라는 건가?'
        ],
        choices: [
            { id: 1, label: '고양이를 따라가 본다.', correct: null, next: 'hidden3', setSecret: true },
            { id: 2, label: '이제 돌아갈 시간이니 입구로 간다.', correct: null, next: 'scene10',
                after: ['고양이에게 손을 흔들고 입구로 향했다.'] }
        ]
    },

    hidden3: {
        type: 'story', bg: '인적 드문 나무 아래', bgImage: 'https://res.cloudinary.com/hquhccft/image/upload/v1788844159/%ED%9E%88%EB%93%A0%EA%B3%A0%EC%96%91%EC%9D%B4.png', bgm: 'hidden',
        lines: [
            '고양이를 따라 조용한 나무 아래로 이동했다. 고양이가 그 자리에 눕고, 나도 옆에 조용히 앉았다.',
            '처음 사찰에 오기로 했을 때는 머릿속이 온통 복잡한 생각뿐이었다.',
            '그런데 지금은— 아무 생각도 안 나네.'
        ],
        next: 'scene10'
    }
};

const JUDGED_ORDER = ['scene01', 'scene03', 'scene04', 'scene05', 'scene06', 'scene07', 'scene08', 'scene09'];

/* =========================================================================
   2. 오늘의 참배 돌아보기 — 오답 해설 데이터
========================================================================= */
const RESULT_EXPLAIN = {
    scene01: { done: true,
        correctLabel: '단정하고 편한 옷을 입는다',
        explain: '사찰에서는 절을 하거나 바닥에 앉는 일이 많으므로, 노출이 많거나 화려한 옷보다는 단정하고 활동하기 편한 옷차림이 예절에 맞다.' },
    scene03: { done: true,
        correctLabel: '왼쪽 또는 오른쪽 문으로 들어간다',
        explain: '법당 정면 중앙의 문(어간문)은 스님이나 큰 법회 때를 위한 문으로, 일반 신도는 좌우 협문을 이용하는 것이 예절이다.' },
    scene04: { done: true,
        correctLabel: '합장 후 반배한다',
        explain: '법당에 들어서면 정면의 불상을 향해 합장한 채 허리와 머리를 약 60도 숙이는 반배로 예를 표하는 것이 기본 인사다.' },
    scene05: { done: true,
        correctLabel: '이미 켜진 초는 그대로 두고 빈자리를 찾는다',
        explain: '다른 사람이 이미 밝힌 초나 향을 임의로 빼거나 끄는 것은 그 사람의 기원을 방해하는 행동으로 여겨진다.' },
    scene06: { done: true,
        correctLabel: '세 번 절한다',
        explain: '삼배는 부처님을 공경하고, 그 가르침을 따르며, 승가를 따른다는 세 가지 의미를 담아 세 번 절하는 것으로, 임의로 횟수를 늘리거나 줄이지 않는 것이 예절이다.' },
    scene07: { done: true,
        correctLabel: '뒤쪽으로 돌아간다',
        explain: '절을 하고 있는 사람의 앞을 지나가면 수행에 방해가 되므로, 뒤쪽으로 돌아가는 것이 예절이다.' },
    scene08: { done: true,
        correctLabel: '합장 후 반배한다',
        explain: '경내에서 스님과 마주치면 허리 숙여 인사하는 대신, 합장한 채 가볍게 반배하는 것이 올바른 인사법이다.' },
    scene09: { done: true,
        correctLabel: '먹을 수 있을 만큼만 담는다',
        explain: '공양은 정성으로 준비된 음식이므로, 먹을 수 있는 만큼만 덜어서 남기지 않는 것이 예절이다.' }
};

/* =========================================================================
   3. 엔딩 정의
========================================================================= */
const ENDINGS = {
    PERFECT: { name: 'PERFECT END', title: '처음 맞아......?', scoreLabel: '8 / 8',
        desc: '당신은 모든 사찰 예절을 올바르게 지켰습니다.' },
    NORMAL: { name: 'NORMAL END', title: '처음이니까', scoreLabel: '6~7 / 8',
        desc: '완벽하지 않아도 괜찮습니다. 오늘 알게 된 만큼, 다음 방문은 조금 더 자연스러울 거예요.' },
    BAD: { name: 'BAD END', title: '......뭔가 이상한데', scoreLabel: '1~5 / 8',
        desc: '몇 가지 사찰 예절을 다시 확인해 보는 것이 좋겠습니다. 다행히 지금부터 알아가면 됩니다.' },
    ZEOLMANG: { name: '絶望 END', title: '다시는 그러지 말자', scoreLabel: '0 / 8',
        desc: '오늘의 사찰 예절을 처음부터 다시 확인해 보는 것을 추천합니다.\n※ 실제 사찰에서는 따라 하지 마세요.' },
    SECRET: { name: 'SECRET END', title: '아무것도 하지 않는 시간', scoreLabel: '',
        desc: '때로는 무언가를 하려고 애쓰지 않고, 잠시 머물러 있는 것만으로도 충분할지도 모릅니다.' }
};
const ENDING_ORDER = ['PERFECT', 'NORMAL', 'BAD', 'ZEOLMANG', 'SECRET'];

function judgeEnding(score, secretFlag) {
    if (secretFlag) return 'SECRET';
    if (score === 8) return 'PERFECT';
    if (score >= 6) return 'NORMAL';
    if (score >= 1) return 'BAD';
    return 'ZEOLMANG';
}

/* =========================================================================
   4. 게임 상태 + 렌더 엔진
========================================================================= */
const state = {
    currentSceneId: 'prologue',
    lineIndex: 0,
    answers: {},
    secretFlag: false,
    forceHiddenNext: false,
    isPlayingAfter: false,
    cameFromHidden: false,  // 9월22일 추가
    // --- 이전 대화 보기용, 게임 진행 상태에는 영향 없음 ---
    log: [],           // [{ text, bgImage, bgLabel }, ...]
    lastLoggedKey: null,
    viewIndex: null,
    liveText: '',
    liveBg: null        // { bgImage, bgLabel }
};

const el = (id) => document.getElementById(id);

let currentLang = 'ko';
function t(key, fallback) {
    const dict = window.SIM_TRANSLATIONS && window.SIM_TRANSLATIONS[currentLang];
    return (dict && dict[key] !== undefined) ? dict[key] : fallback;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el(id).classList.add('active');
}

// image
(function preloadSceneImages() {
    const urls = [...new Set(Object.values(SCENES).map(scene => scene.bgImage).filter(Boolean))];
    const fill = el('loading-bar-fill');
    const percentText = el('loading-percent');
    let loaded = 0;

    if (urls.length === 0) {
        showScreen('screen-title');
        return;
    }

    urls.forEach((url) => {
        const img = new Image();
        img.onload = img.onerror = onOneLoaded;
        img.src = url;
    });

    function onOneLoaded() {
        loaded++;
        const percent = Math.round((loaded / urls.length) * 100);
        fill.style.width = percent + '%';
        percentText.textContent = percent + '%';
        if (loaded === urls.length) showScreen('screen-title');
    }
})();

// bgm
const BGM_KEY = 'etiquetteSim_bgmMuted';
const BGM_URLS = {
    room: BGM_ROOM_URL,
    temple: BGM_TEMPLE_URL,
    hidden: BGM_HIDDEN_URL
};
const BGM_TRACKS = {};
const BGM_VOLUMES = { room: 0.35, temple: 0.6, hidden: 0.35 };

function getBgmTrack(key) {
    if (!BGM_TRACKS[key]) {
        const a = new Audio(BGM_URLS[key]);
        a.loop = true;
        a.volume = 0.35;
        a.muted = bgmMuted;
        BGM_TRACKS[key] = a;
    }
    return BGM_TRACKS[key];
}

let currentBgmKey = null;
let bgmMuted = false;

function isBgmMuted() {
    try {
        return localStorage.getItem(BGM_KEY) === '1';
    } catch (e) {
        return false;
    }
}

function setBgmMuted(muted) {
    bgmMuted = muted;
    Object.values(BGM_TRACKS).forEach(a => {
        a.muted = muted;
    });
    el('btn-bgm-toggle').classList.toggle('muted', muted);
    try {
        localStorage.setItem(BGM_KEY, muted ? '1' : '0');
    } catch (e) {
    }
}
setBgmMuted(isBgmMuted());

// 브금 페이드
const BGM_FADE_MS = 1200;

function clearFade(audio) {
    if(audio._fadeTimer) {
        clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
    }
}

function fadeAudio(audio, from, to, duration, onDone) {
    clearFade(audio);
    const steps = 20;
    const stepTime = duration / steps;
    let count = 0;
    audio.volume = from;
    audio._fadeTimer = setInterval(() => {
        count++;
        const progress = count / steps;
        audio.volume = from + (to - from) * progress;
        if(count >= steps) {
            clearFade(audio);
            audio.volume = to;
            if (onDone) onDone();
        }
    }, stepTime);
}

function playBgmFor(key) {
    if (key === currentBgmKey) return;
    const prevKey = currentBgmKey;
    currentBgmKey = key || null;

    // 이전 트랙: 서서히 줄이다가 끝나면 정지
    if (prevKey && BGM_TRACKS[prevKey]) {
        const prevAudio = BGM_TRACKS[prevKey];
        fadeAudio(prevAudio, prevAudio.volume, 0, BGM_FADE_MS, () => {
            prevAudio.pause();
            prevAudio.currentTime = 0;
        });
    }

    // 새 트랙: 0에서 시작해서 지정 볼륨까지 서서히 키움
    if (currentBgmKey) {
        const audio = getBgmTrack(currentBgmKey);
        const targetVolume = BGM_VOLUMES[currentBgmKey] ?? 0.35;
        if(audio.paused) {
            audio.volume = 0;
            audio.play().catch(() => {});
        }
        fadeAudio(audio, audio.volume, targetVolume, BGM_FADE_MS);
    }
}

function startGame() {
    state.currentSceneId = 'prologue';
    state.lineIndex = 0;
    state.answers = {};
    state.secretFlag = false;
    state.isPlayingAfter = false;
    state.forceHiddenNext = false;
    state.log = [];
    state.lastLoggedKey = null;
    state.viewIndex = null;
    state.liveText = '';
    state.liveBg = null;
    state.cameFromHidden = false;
    el('dialogue-dock').classList.remove('dialogue-hidden');
    el('btn-toggle-dialogue').classList.remove('active');
    showScreen('screen-scene');
    renderScene();
}

function renderScene() {
    const scene = SCENES[state.currentSceneId];
    let bgmKey = scene.bgm || null;
    if(state.currentSceneId === 'scene10' && state.cameFromHidden){
        bgmKey = 'hidden';
    }
    playBgmFor(bgmKey);

    el('bg-label').textContent = 'BG: ' + scene.bg;
    const bgLayer = el('bg-layer');
    if (scene.bgImage) {
        bgLayer.style.backgroundImage = "url('" + scene.bgImage + "')";
        bgLayer.classList.add('has-image');
    } else {
        bgLayer.style.backgroundImage = '';
        bgLayer.classList.remove('has-image');
    }

    const lineText = t(state.currentSceneId + '.line' + state.lineIndex, scene.lines[state.lineIndex]);
    el('story-text').textContent = lineText;
    state.liveText = lineText;
    state.liveBg = { bgImage: scene.bgImage || null, bgLabel: scene.bg };

    const logKey = state.currentSceneId + '#' + state.lineIndex;
    if (state.lastLoggedKey !== logKey) {
        state.log.push({ text: lineText, bgImage: scene.bgImage || null, bgLabel: scene.bg });
        state.lastLoggedKey = logKey;
    } else if (state.log.length) {
        state.log[state.log.length - 1].text = lineText; // 언어 전환 시 텍스트만 최신화
    }

    const isLastLine = state.lineIndex === scene.lines.length - 1;
    const choiceLayer = el('choice-layer');
    choiceLayer.innerHTML = '';

    if (isLastLine && scene.type === 'choice') {
        el('advance-hint').style.display = 'none';
        shuffle([...scene.choices]).forEach((choice) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = t(state.currentSceneId + '.choice' + choice.id + '.label', choice.label);
            btn.onclick = () => selectChoice(scene, choice);
            choiceLayer.appendChild(btn);
        });
    } else {
        el('advance-hint').style.display = 'block';
    }

    updateHistoryButtonState();
}

function selectChoice(scene, choice) {
    if (scene.judged) {
        state.answers[state.currentSceneId] = {
            choiceId: choice.id,
            label: choice.label,
            correct: choice.correct
        };
    }
    if (choice.setSecret) {
        state.secretFlag = true;
    }
    if (choice.after && choice.after.length) {
        const afterKeyPrefix = state.currentSceneId + '.choice' + choice.id + '.after';
        const translatedAfter = choice.after.map((line, i) => t(afterKeyPrefix + i, line));
        playLines(translatedAfter, 0, () => advanceTo(choice.next));
        return;
    }
    advanceTo(choice.next);
}

function playLines(lines, index, onDone) {
    state.isPlayingAfter = true;
    const scene = SCENES[state.currentSceneId];
    const lineText = lines[index];
    el('story-text').textContent = lineText;
    state.liveText = lineText;
    state.liveBg = { bgImage: scene.bgImage || null, bgLabel: scene.bg };
    state.log.push({ text: lineText, bgImage: scene.bgImage || null, bgLabel: scene.bg });
    updateHistoryButtonState();
    el('choice-layer').innerHTML = '';
    el('advance-hint').style.display = 'block';
    const isLast = index === lines.length - 1;

    const targets = [el('bg-layer'), el('text-box')];
    const handleClick = () => {
        if (state.viewIndex !== null) { exitHistoryMode(); return; }
        targets.forEach(t => t.removeEventListener('click', handleClick));
        if (isLast) {
            state.isPlayingAfter = false;
            onDone();
        } else {
            playLines(lines, index + 1, onDone);
        }
    };
    targets.forEach(t => t.addEventListener('click', handleClick));
}

function advanceTo(nextId) {
    if (nextId === 'HIDDEN_CHECK') {
        const trigger = state.forceHiddenNext || Math.random() < 0.35;
        state.forceHiddenNext = false;
        if (trigger) state.cameFromHidden = true;
        nextId = trigger ? 'hidden1' : 'scene10';
    }
    if (nextId === 'ENDING') {
        showEnding();
        return;
    }
    state.currentSceneId = nextId;
    state.lineIndex = 0;
    renderScene();
}

function advanceLine() {
    if (state.viewIndex !== null) { exitHistoryMode(); return; }
    if (state.isPlayingAfter) return;
    const scene = SCENES[state.currentSceneId];
    if (state.lineIndex < scene.lines.length - 1) {
        state.lineIndex++;
        renderScene();
        return;
    }
    if (scene.type === 'story') {
        advanceTo(scene.next);
    }
}

/* ---------- 이전 대화 보기 (게임 상태는 건드리지 않는 읽기 전용 되감기, 배경 포함) ---------- */
function updateHistoryButtonState() {
    const canGoBack = state.viewIndex !== null ? state.viewIndex > 0 : state.log.length >= 2;
    el('btn-history-back').disabled = !canGoBack;
}

function showHistoryLine() {
    const entry = state.log[state.viewIndex];
    el('story-text').textContent = entry.text;

    const bgLayer = el('bg-layer');
    if (entry.bgImage) {
        bgLayer.style.backgroundImage = "url('" + entry.bgImage + "')";
        bgLayer.classList.add('has-image');
    } else {
        bgLayer.style.backgroundImage = '';
        bgLayer.classList.remove('has-image');
    }
    el('bg-label').textContent = 'BG: ' + entry.bgLabel;

    el('choice-layer').innerHTML = '';
    el('advance-hint').style.display = 'none';
    el('btn-history-back').classList.add('active');
    updateHistoryButtonState();
}

function exitHistoryMode() {
    state.viewIndex = null;
    el('btn-history-back').classList.remove('active');
    if (state.isPlayingAfter) {
        el('story-text').textContent = state.liveText;

        const bgLayer = el('bg-layer');
        if (state.liveBg && state.liveBg.bgImage) {
            bgLayer.style.backgroundImage = "url('" + state.liveBg.bgImage + "')";
            bgLayer.classList.add('has-image');
        } else {
            bgLayer.style.backgroundImage = '';
            bgLayer.classList.remove('has-image');
        }
        if (state.liveBg) el('bg-label').textContent = 'BG: ' + state.liveBg.bgLabel;

        el('choice-layer').innerHTML = '';
        el('advance-hint').style.display = 'block';
    } else {
        renderScene();
    }
    updateHistoryButtonState();
}

el('bg-layer').addEventListener('click', advanceLine);
el('text-box').addEventListener('click', advanceLine);

el('btn-history-back').addEventListener('click', () => {
    if (state.viewIndex === null) {
        if (state.log.length < 2) return;
        state.viewIndex = state.log.length - 2;
    } else if (state.viewIndex > 0) {
        state.viewIndex--;
    } else {
        return;
    }
    showHistoryLine();
});

el('btn-toggle-dialogue').addEventListener('click', () => {
    const hidden = el('dialogue-dock').classList.toggle('dialogue-hidden');
    el('btn-toggle-dialogue').classList.toggle('active', hidden);
});

/*----------시뮬레이션 처음으로 돌아가기----------------*/
function stopBgm() {
    playBgmFor(null);
}

el('btn-restart-title').addEventListener('click', () => {
    const ok = confirm('진행 중인 내용이 사라집니다. 처음 화면으롤 돌아갈까요?');
    if(!ok) return;
    stopBgm();
    showScreen('screen-title');
});

/* ---------- 엔딩 계산 + 화면 ---------- */
function showEnding(forcedKey) {
    let key = forcedKey;
    if (!key) {
        const score = JUDGED_ORDER.reduce((sum, id) => sum + (state.answers[id]?.correct ? 1 : 0), 0);
        key = judgeEnding(score, state.secretFlag);
    }
    state.lastEndingKey = key;
    const ending = ENDINGS[key];
    el('ending-name').textContent = ending.name;
    el('ending-title').textContent = '「' + t(key + '.title', ending.title) + '」';
    el('ending-score').textContent = ending.scoreLabel;
    el('ending-desc').textContent = t(key + '.desc', ending.desc);
    unlockEnding(key);
    showScreen('screen-ending');
}

/* ---------- 결과: 오늘의 참배 돌아보기 ---------- */
function showResult() {
    const total = JUDGED_ORDER.length;
    const correctCount = JUDGED_ORDER.reduce((sum, id) => sum + (state.answers[id]?.correct ? 1 : 0), 0);

    const summaryTemplate = t('ui.resultSummary', '{total}가지 예절 중 {correct}가지를 잘 지켰어요');
    el('result-summary').innerHTML =
        summaryTemplate.replace('{total}', total).replace('{correct}', correctCount) +
        `<small>${t('ui.resultSummarySub', '아래에서 오늘 방문을 다시 확인해보세요.')}</small>`;

    const checklist = el('checklist');
    checklist.innerHTML = '';
    const correctIds = JUDGED_ORDER.filter(id => state.answers[id]?.correct);
    correctIds.forEach((id) => {
        const scene = SCENES[id];
        const row = document.createElement('div');
        row.className = 'check-item correct';
        row.textContent = '✓ ' + scene.resultId.no + ' ' + t(id + '.resultTitle', scene.resultId.title);
        checklist.appendChild(row);
    });

    const reviewList = el('review-list');
    reviewList.innerHTML = '';
    const wrongIds = JUDGED_ORDER.filter(id => !state.answers[id]?.correct);

    if (wrongIds.length === 0) {
        const cta = document.createElement('div');
        cta.style.marginTop = '18px';
        cta.innerHTML = `
      <p style="margin:0 0 12px;font-size:13.5px;color:#7a6c55;">${t('ui.noWrongText', '다시 알아볼 예절이 없습니다.')}</p>
      <button class="btn btn-primary" id="btn-guide-cta">${t('ui.guideCta', '사찰 예절 자세히 알아보기')}</button>
    `;
        reviewList.appendChild(cta);
        el('btn-guide-cta').onclick = () => {
            location.href = '/info?category=' + encodeURIComponent('예절가이드');
        };
    } else {
        const title = document.createElement('div');
        title.className = 'result-section-title';
        title.textContent = t('ui.reviewTitle', '다시 알아볼 예절');
        reviewList.appendChild(title);

        const cardsWrap = document.createElement('div');
        cardsWrap.id = 'review-cards';
        reviewList.appendChild(cardsWrap);

        wrongIds.forEach((id) => {
            const scene = SCENES[id];
            const info = RESULT_EXPLAIN[id];
            const answer = state.answers[id];
            const myChoiceLabel = answer
                ? t(id + '.choice' + answer.choiceId + '.label', answer.label)
                : t('ui.noAnswerRecorded', '(선택 기록 없음)');
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
        <h4>${scene.resultId.no} ${t(id + '.resultTitle', scene.resultId.title)} ${info.done ? '' : '<span class="todo-tag">TODO</span>'}</h4>
        <div class="review-row"><b>${t('ui.myChoiceHeading', '내가 선택한 행동')}</b>${myChoiceLabel}</div>
        <div class="review-row"><b>${t('ui.correctActionHeading', '올바른 행동')}</b>${t(id + '.correctLabel', info.correctLabel)}</div>
        <div class="review-explain">${t(id + '.explain', info.explain)}</div>
      `;
            cardsWrap.appendChild(card);
        });
    }

    showScreen('screen-result');
}

/* ---------- 엔딩 도감 (localStorage) ---------- */
const COLLECTION_KEY = 'etiquetteSim_endingCollection';

function getCollection() {
    try {
        return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || {};
    } catch (e) { return {}; }
}
function unlockEnding(key) {
    try {
        const data = getCollection();
        data[key] = true;
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage 사용 불가 환경 — 조용히 무시 */ }
}
function renderCollection() {
    const data = getCollection();
    const grid = el('collection-grid');
    grid.innerHTML = '';
    ENDING_ORDER.forEach((key) => {
        const unlocked = !!data[key];
        const ending = ENDINGS[key];
        const cell = document.createElement('div');
        cell.className = 'collection-cell' + (unlocked ? ' unlocked' : '');
        cell.innerHTML = unlocked
            ? `<div class="mark">${key === 'SECRET' ? '★' : '◆'}</div>${ending.name}<br>「${t(key + '.title', ending.title)}」`
            : `<div class="mark">?</div>????????`;
        grid.appendChild(cell);
    });
}

/* ---------- 사전형식 번역: 언어 전환 훅 ---------- */
function onLanguageChange(lang) {
    currentLang = lang;
    if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(lang);

    const dict = window.SIM_TRANSLATIONS && window.SIM_TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach((elm) => {
        const key = elm.getAttribute('data-i18n');
        if (dict && dict[key] !== undefined) elm.textContent = dict[key];
    });

    if (el('screen-scene').classList.contains('active')) {
        if (state.isPlayingAfter) return;
        if (state.viewIndex !== null) return;
        renderScene();
    } else if (el('screen-ending').classList.contains('active') && state.lastEndingKey) {
        showEnding(state.lastEndingKey);
    } else if (el('screen-result').classList.contains('active')) {
        showResult();
    } else if (el('screen-collection').classList.contains('active')) {
        renderCollection();
    }
}

/* ---------- 버튼 바인딩 ---------- */
el('btn-start').onclick = startGame;
el('btn-open-collection').onclick = () => { renderCollection(); showScreen('screen-collection'); };
el('btn-close-collection').onclick = () => showScreen('screen-title');
el('btn-goto-result').onclick = showResult;
el('btn-result-replay').onclick = startGame;
el('btn-result-title').onclick = () => { stopBgm(); showScreen('screen-title'); };