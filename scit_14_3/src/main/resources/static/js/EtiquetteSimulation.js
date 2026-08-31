/* =========================================================================
   1. SCENE DATA
   ------------------------------------------------------------------------
   모든 대사/선택지는 이 객체 하나에서 관리합니다.
   화면 출력 로직(4번)은 이 데이터를 순서대로 읽어서 그릴 뿐, 내용을 모릅니다.
   => 시나리오 텍스트만 여기서 수정하면 화면에 그대로 반영됩니다.

   scene 필드 설명
   - type: 'story' (선택지 없음, 클릭하면 next로) | 'choice' (선택지로 분기)
   - bg:   배경 placeholder 라벨 (실제 배경 이미지 나오면 background-image로 교체)
   - speaker: 화자 표시 (없으면 생략)
   - lines: 순서대로 출력할 대사 배열 (한 줄씩 클릭으로 넘김)
   - choices: [{ id, label, correct, next, after, setSecret }]
     - id: 선택지 식별자(①②③ 순번). state.answers에 실제 선택 기록할 때 사용
     - correct: 결과 화면 판정에 쓰임 (judged scene에서만 의미 있음)
     - after: 선택 직후 보여줄 반응 대사 배열(0개 이상). 확정 시나리오에 대사가
       있는 선택지만 채워져 있음 — 없으면 바로 next로 진행. 정오답 노출 없이
       자연스러운 대사만 보여주고, 이 줄들도 다른 대사와 동일하게 클릭해서 넘김
   - judged: 결과 판정(8개 Scene)에 포함되는지 여부
   - resultId: 결과 화면에서 쓸 표시번호/제목 (judged 씬만)
========================================================================= */
const SCENES = {

    prologue: {
        type: 'story', bg: '집',
        lines: [
            '오랜만에 마음이 복잡했다.',
            '누가 그러던데, 이럴 땐 절에 가서 마음을 좀 가라앉히고 오는 것도 나쁘지 않다고.',
            '그래서, 처음으로— 절에 가보기로 했다.'
        ],
        next: 'scene01'
    },

    scene01: {
        type: 'choice', bg: '집 · 옷장 앞', judged: true,
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
        type: 'story', bg: '사찰 입구 → 경내',
        lines: [
            '얼마 후, 사찰에 도착했다. 생각했던 것보다 조용했다.',
            '바깥에서 들리던 소리도 어느새 멀어지고, 가끔 바람에 나뭇잎이 흔들리는 소리만 들려왔다.',
            '나: 여기가 절이구나....... 생각보다 조용하네. 일단 안으로 들어가 볼까.'
        ],
        next: 'scene03'
    },

    scene03: {
        type: 'choice', bg: '법당 정면 (문 3개)', judged: true,
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
        type: 'choice', bg: '법당 내부 · 불상', judged: true,
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
        type: 'choice', bg: '법당 내부 · 초와 향', judged: true,
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
        type: 'choice', bg: '법당 내부 · 불상 앞', judged: true,
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
        type: 'choice', bg: '법당 내부 · 다른 참배객', judged: true,
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
        type: 'choice', bg: '사찰 경내 · 스님과 마주침', judged: true,
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
        type: 'choice', bg: '사찰 공양간', judged: true,
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
        type: 'story', bg: '사찰 경내 · 노을',
        lines: [
            '공양을 마치고 밖으로 나오니 어느새 시간이 꽤 지나 있었다.',
            '처음 들어왔을 때보다 경내가 조금 익숙하게 느껴졌다.',
            '나: 벌써 갈 시간이네. ......처음이라 제대로 한 건지는 잘 모르겠지만....... 그래도 오길 잘한 것 같다.',
            '(바람이 불자 풍경 소리) 나: 아까보다는 조금 괜찮아진 것 같아.'
        ],
        next: 'ENDING'
    },

    hidden1: {
        type: 'choice', bg: '사찰 경내 · 마루 밑 고양이',
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
        type: 'choice', bg: '사찰 경내 · 앞장서는 고양이',
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
        type: 'story', bg: '인적 드문 나무 아래',
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
   ------------------------------------------------------------------------
   결과 화면에서 "다시 알아볼 예절" 블록에 쓰이는 문구.
   "내가 선택한 행동"은 이제 이 객체가 아니라 state.answers[id].label
   (플레이어가 실제로 고른 선택지 문구)에서 그대로 가져와 보여줍니다.
   이 객체는 "올바른 행동"과 "설명"만 담당합니다.
   설명 문구는 claude/사찰예절_리서치.md에서 확인한 출처 기반 내용을 근거로 작성함.
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
   ------------------------------------------------------------------------
   engine은 SCENES 데이터를 "읽기만" 합니다. 텍스트/선택지를 바꿀 때
   이 아래 코드는 건드릴 필요가 없습니다.
========================================================================= */
const state = {
    currentSceneId: 'prologue',
    lineIndex: 0,
    answers: {},        // { scene01: { choiceId, label, correct }, ... } 판정 대상 씬에서 실제 고른 선택지 기록
    secretFlag: false,
    forceHiddenNext: false,
    isPlayingAfter: false  // true인 동안은 playLines()가 클릭을 전담하고, 기존 advanceLine()은 끼어들지 않음
};

const el = (id) => document.getElementById(id);

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el(id).classList.add('active');
}

function startGame() {
    state.currentSceneId = 'prologue';
    state.lineIndex = 0;
    state.answers = {};
    state.secretFlag = false;
    state.isPlayingAfter = false;
    state.forceHiddenNext = false; // 개발자 패널에서 강제 히든을 켜둔 채 재시작해도 다음 판까지 남지 않도록 초기화
    showScreen('screen-scene');
    renderScene();
}

function renderScene() {
    const scene = SCENES[state.currentSceneId];
    el('bg-label').textContent = 'BG: ' + scene.bg;
    el('story-text').textContent = scene.lines[state.lineIndex];

    const isLastLine = state.lineIndex === scene.lines.length - 1;
    const choiceLayer = el('choice-layer');
    choiceLayer.innerHTML = '';

    if (isLastLine && scene.type === 'choice') {
        el('advance-hint').style.display = 'none';
        scene.choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.label;
            btn.onclick = () => selectChoice(scene, choice);
            choiceLayer.appendChild(btn);
        });
    } else {
        el('advance-hint').style.display = 'block';
    }
}

function selectChoice(scene, choice) {
    if (scene.judged) {
        // 정오답 여부뿐 아니라 실제로 고른 선택지(id/문구)까지 기록 —
        // 결과 화면 "내가 선택한 행동"에 이 label을 그대로 보여줌
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
        // 선택 직후 반응 대사(1줄 이상)를 다른 대사와 동일하게 한 줄씩 보여주고 넘어감 (정오답 노출 없음)
        playLines(choice.after, 0, () => advanceTo(choice.next));
        return;
    }
    advanceTo(choice.next);
}

function playLines(lines, index, onDone) {
    // 씬 사이에 임시 대사(선택 후 반응 등)를 끼워 보여줄 때 사용.
    // 기존 대사 진행과 동일하게 배경(#bg-layer)이든 대사창(#text-box)이든
    // 어디를 클릭해도 다음 줄 → 마지막 줄에서는 onDone으로 넘어감.
    //
    // isPlayingAfter를 켜두는 이유: bg-layer/text-box에는 이미 advanceLine()을
    // 부르는 전역 클릭 리스너가 등록돼 있음. 여기서 추가로 handleClick을 붙이면
    // 같은 클릭에 두 리스너가 함께 실행될 수 있으므로, advanceLine() 쪽에서
    // 이 플래그를 보고 스스로 아무 것도 하지 않도록 막아둠(아래 advanceLine 참고).
    state.isPlayingAfter = true;
    el('story-text').textContent = lines[index];
    el('choice-layer').innerHTML = '';
    el('advance-hint').style.display = 'block';
    const isLast = index === lines.length - 1;

    const targets = [el('bg-layer'), el('text-box')];
    const handleClick = (e) => {
        if (e.target.id === 'dev-badge') return;
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
        const trigger = state.forceHiddenNext || Math.random() < 0.35; // 30~40% 고정 확률
        state.forceHiddenNext = false;
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
    if (state.isPlayingAfter) return; // after-대사 재생 중에는 일반 진행 로직을 막고 playLines()에게만 맡김
    const scene = SCENES[state.currentSceneId];
    if (state.lineIndex < scene.lines.length - 1) {
        state.lineIndex++;
        renderScene();
        return;
    }
    if (scene.type === 'story') {
        advanceTo(scene.next);
    }
    // type === 'choice'이고 마지막 줄이면 선택지 클릭을 기다림 (아무 동작 없음)
}

el('bg-layer').addEventListener('click', (e) => {
    if (e.target.id === 'dev-badge') return;
    advanceLine();
});
el('text-box').addEventListener('click', advanceLine);

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
    el('ending-title').textContent = '「' + ending.title + '」';
    el('ending-score').textContent = ending.scoreLabel;
    el('ending-desc').textContent = ending.desc;
    unlockEnding(key);
    showScreen('screen-ending');
}

/* ---------- 결과: 오늘의 참배 돌아보기 ---------- */
function showResult() {
    const total = JUDGED_ORDER.length;
    const correctCount = JUDGED_ORDER.reduce((sum, id) => sum + (state.answers[id]?.correct ? 1 : 0), 0);

    // SECRET END는 엔딩 화면(screen-ending)에서만 점수를 숨김(ENDINGS.SECRET.scoreLabel === '').
    // 결과 화면(오늘의 참배 돌아보기)에서는 다른 엔딩과 동일하게 실제 정답 개수를 보여줌.
    el('result-summary').innerHTML =
        `${total}가지 예절 중 ${correctCount}가지를 잘 지켰어요` +
        '<small>아래에서 오늘 방문을 다시 확인해보세요.</small>';

    // 체크리스트 — 잘 지킨 예절만 제목 위주로 간단히 표시
    const checklist = el('checklist');
    checklist.innerHTML = '';
    const correctIds = JUDGED_ORDER.filter(id => state.answers[id]?.correct);
    correctIds.forEach((id) => {
        const scene = SCENES[id];
        const row = document.createElement('div');
        row.className = 'check-item correct';
        row.textContent = '✓ ' + scene.resultId.no + ' ' + scene.resultId.title;
        checklist.appendChild(row);
    });

    // 다시 알아볼 예절 (오답 중심) — "내가 선택한 행동"은 state.answers에 저장된 실제 선택 문구를 그대로 사용
    const reviewList = el('review-list');
    reviewList.innerHTML = '';
    const wrongIds = JUDGED_ORDER.filter(id => !state.answers[id]?.correct);

    if (wrongIds.length === 0) {
        const cta = document.createElement('div');
        cta.style.marginTop = '18px';
        cta.innerHTML = `
      <p style="margin:0 0 12px;font-size:13.5px;color:#7a6c55;">다시 알아볼 예절이 없습니다.</p>
      <button class="btn btn-primary" id="btn-guide-cta">사찰 예절 자세히 알아보기</button>
    `;
        reviewList.appendChild(cta);
        el('btn-guide-cta').onclick = () => alert('/info?category=예절가이드 로 이동 (연결 예정)');
    } else {
        const title = document.createElement('div');
        title.className = 'result-section-title';
        title.textContent = '다시 알아볼 예절';
        reviewList.appendChild(title);

        const cardsWrap = document.createElement('div');
        cardsWrap.id = 'review-cards';
        reviewList.appendChild(cardsWrap);

        wrongIds.forEach((id) => {
            const scene = SCENES[id];
            const info = RESULT_EXPLAIN[id];
            const myChoiceLabel = state.answers[id]?.label ?? '(선택 기록 없음)';
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
        <h4>${scene.resultId.no} ${scene.resultId.title} ${info.done ? '' : '<span class="todo-tag">TODO</span>'}</h4>
        <div class="review-row"><b>내가 선택한 행동</b>${myChoiceLabel}</div>
        <div class="review-row"><b>올바른 행동</b>${info.correctLabel}</div>
        <div class="review-explain">${info.explain}</div>
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
            ? `<div class="mark">${key === 'SECRET' ? '★' : '◆'}</div>${ending.name}<br>「${ending.title}」`
            : `<div class="mark">?</div>????????`;
        grid.appendChild(cell);
    });
}

/* ---------- 버튼 바인딩 ---------- */
el('btn-start').onclick = startGame;
el('btn-open-collection').onclick = () => { renderCollection(); showScreen('screen-collection'); };
el('btn-close-collection').onclick = () => showScreen('screen-title');
el('btn-goto-result').onclick = showResult;
el('btn-result-replay').onclick = startGame;
el('btn-result-title').onclick = () => showScreen('screen-title');

/* ---------- 개발자 패널 (발표/시연용 강제 트리거) ---------- */
el('dev-badge').onclick = () => el('dev-panel').classList.add('active');
el('dev-close').onclick = () => el('dev-panel').classList.remove('active');
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') el('dev-panel').classList.toggle('active');
});
document.querySelectorAll('[data-force-hidden]').forEach(btn => {
    btn.onclick = () => {
        state.forceHiddenNext = btn.dataset.forceHidden === '1';
        el('dev-panel').classList.remove('active');
    };
});
document.querySelectorAll('[data-jump-ending]').forEach(btn => {
    btn.onclick = () => {
        el('dev-panel').classList.remove('active');
        showEnding(btn.dataset.jumpEnding);
    };
});