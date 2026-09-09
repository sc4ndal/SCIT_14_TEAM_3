/* 예절 가이드 사전형식 번역 - buddhism/terms.i18n.js와 동일한 패턴.
   common.js가 언어 버튼 클릭 시 이 파일의 onLanguageChange(lang)을 호출한다. */
const TRANSLATIONS = {
    ko: {
        guideKicker: "준비하기",
        guideTitle: "사찰 예절 가이드",
        guideSubtitle1: "처음 사찰에 방문할 때 알아두면 좋은 예절을 상황별로 정리했어요.",
        guideSubtitle2: "궁금한 항목을 눌러보세요.",
        guideBackHome: "메인으로 돌아가기",
        guideGoSimulation: "시뮬레이션 하러가기",

        cat_A_title: "방문 준비",
        item_A1_action: "단정하고 편한 옷차림",
        item_A1_reason: "절하거나 바닥에 앉을 일이 많아서, 편한 옷이 예절에도 맞고 실제로도 편하다.",
        item_A2_action: "벗기 편한 신발 준비",
        item_A2_reason: "사찰 내부는 신발을 벗고 들어가는 공간이 많다.",
        item_A3_action: "법당에서는 양말 착용(맨발 금지)",
        item_A3_reason: "법당에 맨발로 들어가지 않는 것이 예의다.",

        cat_B_title: "법당에 들어가기",
        item_B1_action: "가운데 문(어간문) 대신 좌우측 문 이용",
        item_B1_reason: "어간문은 주지스님·원로스님, 큰 법회 때를 위한 문이다.",
        item_B2_action: "문은 소리 나지 않게 닫기",
        item_B2_reason: "안에서 참배하는 사람들을 방해하지 않기 위해서다.",
        item_B3_action: "들어서면 불상을 향해 합장 반배",
        item_B3_reason: "법당에 들어설 때의 기본 인사다.",
        item_B4_action: "이미 켜진 초·향은 그대로 두고 빈자리 찾기",
        item_B4_reason: "다른 사람의 발원(기원)을 방해하지 않고, 낭비도 막기 위해서다.",
        item_B5_action: "중앙 통로 대신 양옆으로 이동",
        item_B5_reason: "참배객 통행을 방해하지 않기 위해서다.",

        cat_C_title: "절하는 법",
        item_C1_action: "합장: 두 손바닥·손가락을 가지런히 붙이고 손목을 가슴에서 약 5cm 띄워 세움",
        item_C1_reason: "기본 자세다.",
        item_C2_action: "반배: 합장한 채 허리와 머리를 약 60도 숙임",
        item_C2_reason: "스님과 마주쳤을 때, 법당을 드나들 때 사용한다.",
        item_C3_action: "삼배(큰절)는 세 번 — 임의로 늘리거나 줄이지 않기",
        item_C3_reason: "부처님을 공경하고, 가르침을 따르고, 승가를 따른다는 세 가지 의미를 담은 정해진 횟수다.",

        cat_D_title: "다른 사람 배려하기",
        item_D1_action: "절하고 있는 사람 앞을 지나가지 않기",
        item_D1_reason: "수행을 방해하지 않도록 뒤쪽으로 돌아간다.",
        item_D2_action: "스님과 마주치면 합장 반배 (허리 숙여 인사 X)",
        item_D2_reason: "사찰에서의 올바른 인사법이다.",
        item_D3_action: "스님이 공양·좌선·휴식 중이거나 새벽예불 전이면 인사 생략",
        item_D3_reason: "방해가 되지 않게 하기 위해서다.",
        item_D4_action: "스님과 대화할 때는 존칭 사용, 짧게",
        item_D4_reason: "기본 예의다.",

        cat_E_title: "공양간에서",
        item_E1_action: "먹을 수 있는 만큼만 담기",
        item_E1_reason: "정성으로 준비된 음식을 남기지 않기 위해서다.",
        item_E2_action: "외부 음식 반입하지 않기",
        item_E2_reason: "사찰에서 제공하는 공양만 먹는 것이 원칙이다.",
        item_E3_action: "육류·마늘·파 등 오신채류는 보통 없음",
        item_E3_reason: "참고로 알아두면 좋다.",

        cat_F_title: "법회 참석 시",
        item_F1_action: "의식집·필기도구 미리 준비",
        item_F2_action: "시작 20~30분 전 도착, 늦었다면 조용히 착석",
        item_F2_reason: "자리를 정돈할 시간을 확보하기 위해서다.",
        item_F3_action: "중간에 일어나 나가지 않기",
        item_F3_reason: "실례가 되는 행동이다.",

        cat_G_title: "나갈 때",
        item_G1_action: "쓰레기는 정해진 장소에, 개인 물건 챙기기",
        item_G2_action: "조용히 퇴장",
        item_G2_reason: "들어올 때와 마찬가지다.",

        cat_H_title: "경내에서 항상 지킬 것",
        item_H1_action: "음주·육식·흡연·고성방가 금지",
        item_H2_action: "비치된 물품은 소중히 다루기"
    },
    en: {
        guideKicker: "Getting Ready",
        guideTitle: "Temple Etiquette Guide",
        guideSubtitle1: "Here's what's good to know before your first temple visit, organized by situation.",
        guideSubtitle2: "Tap a topic to learn more.",
        guideBackHome: "Back to Home",
        guideGoSimulation: "Try the Simulation",

        cat_A_title: "Before You Go",
        item_A1_action: "Wear neat, comfortable clothing",
        item_A1_reason: "You'll be bowing and sitting on the floor often, so comfortable clothes are both proper and practical.",
        item_A2_action: "Bring shoes that are easy to slip off",
        item_A2_reason: "Many areas inside the temple require removing your shoes.",
        item_A3_action: "Wear socks in the main hall (bare feet not allowed)",
        item_A3_reason: "Entering the main hall barefoot is considered impolite.",

        cat_B_title: "Entering the Main Hall",
        item_B1_action: "Use the side doors, not the central door (eogan-mun)",
        item_B1_reason: "The central door is reserved for the abbot, senior monks, and major ceremonies.",
        item_B2_action: "Close doors quietly",
        item_B2_reason: "So as not to disturb those already worshipping inside.",
        item_B3_action: "Once inside, face the Buddha statue and bow with palms joined",
        item_B3_reason: "This is the basic greeting when entering the main hall.",
        item_B4_action: "Leave lit candles and incense as they are, and find an open spot",
        item_B4_reason: "So as not to disturb someone else's prayer, and to avoid waste.",
        item_B5_action: "Move along the sides rather than the center aisle",
        item_B5_reason: "So as not to block the path of other worshippers.",

        cat_C_title: "How to Bow",
        item_C1_action: "Hapjang (palms joined): press palms and fingers evenly together, hands about 5cm in front of your chest",
        item_C1_reason: "This is the basic posture.",
        item_C2_action: "Half bow: with palms joined, bend your waist and head about 60 degrees",
        item_C2_reason: "Used when meeting a monk, or entering/leaving the main hall.",
        item_C3_action: "The full bow (sambae) is done three times — don't add or skip",
        item_C3_reason: "The fixed number of three represents honoring the Buddha, following the teachings, and following the sangha.",

        cat_D_title: "Consideration for Others",
        item_D1_action: "Don't walk in front of someone who is bowing",
        item_D1_reason: "Go around from behind so as not to disturb their practice.",
        item_D2_action: "Greet a monk with a joined-palm bow (not a standard bow from the waist)",
        item_D2_reason: "This is the correct way to greet someone at a temple.",
        item_D3_action: "Skip the greeting if a monk is eating, meditating, resting, or it's before the dawn service",
        item_D3_reason: "So as not to be a disturbance.",
        item_D4_action: "Use polite language with monks, and keep it brief",
        item_D4_reason: "This is basic courtesy.",

        cat_E_title: "In the Dining Hall",
        item_E1_action: "Take only as much food as you can eat",
        item_E1_reason: "So as not to waste food that was prepared with care.",
        item_E2_action: "Don't bring in outside food",
        item_E2_reason: "The rule is to eat only what the temple provides.",
        item_E3_action: "Meat, garlic, and scallions (the \"five pungent roots\") are usually not served",
        item_E3_reason: "Good to know in advance.",

        cat_F_title: "Attending a Dharma Service",
        item_F1_action: "Bring a ritual text and something to write with beforehand",
        item_F2_action: "Arrive 20-30 minutes early; if late, sit down quietly",
        item_F2_reason: "This gives you time to settle in.",
        item_F3_action: "Don't get up and leave partway through",
        item_F3_reason: "This is considered rude.",

        cat_G_title: "When Leaving",
        item_G1_action: "Dispose of trash in the designated spot and gather your belongings",
        item_G2_action: "Leave quietly",
        item_G2_reason: "The same courtesy as when you arrived.",

        cat_H_title: "Always Follow These On the Grounds",
        item_H1_action: "No drinking, eating meat, smoking, or loud behavior",
        item_H2_action: "Treat shared items with care"
    },
    ja: {
        guideKicker: "準備する",
        guideTitle: "寺院マナーガイド",
        guideSubtitle1: "初めて寺院を訪れる際に知っておくとよいマナーを、場面別にまとめました。",
        guideSubtitle2: "気になる項目をタップしてみてください。",
        guideBackHome: "メインへ戻る",
        guideGoSimulation: "シミュレーションへ",

        cat_A_title: "訪問の準備",
        item_A1_action: "清潔で動きやすい服装",
        item_A1_reason: "お辞儀をしたり床に座ることが多いため、楽な服装がマナーにも実用面にも適しています。",
        item_A2_action: "脱ぎやすい靴を用意",
        item_A2_reason: "寺院内部には靴を脱いで入る場所が多くあります。",
        item_A3_action: "法堂では靴下を着用(素足禁止)",
        item_A3_reason: "法堂に素足で入らないのがマナーです。",

        cat_B_title: "法堂に入るとき",
        item_B1_action: "中央の門(御間門)ではなく左右の門を利用",
        item_B1_reason: "御間門は住職・長老僧、大きな法要のための門です。",
        item_B2_action: "扉は音を立てずに閉める",
        item_B2_reason: "中で参拝している人の邪魔をしないためです。",
        item_B3_action: "入ったら仏像に向かって合掌し半拝",
        item_B3_reason: "法堂に入るときの基本的な挨拶です。",
        item_B4_action: "すでに灯されたろうそく・線香はそのままにし、空いている場所を探す",
        item_B4_reason: "他の人の発願(祈り)の邪魔をせず、無駄も防ぐためです。",
        item_B5_action: "中央の通路ではなく両脇を通る",
        item_B5_reason: "参拝者の通行の妨げにならないためです。",

        cat_C_title: "礼拝の作法",
        item_C1_action: "合掌:両手のひらと指をきれいに合わせ、手首を胸から約5cm離して立てる",
        item_C1_reason: "基本の姿勢です。",
        item_C2_action: "半拝:合掌したまま腰と頭を約60度傾ける",
        item_C2_reason: "僧侶と出会ったときや、法堂の出入りの際に使います。",
        item_C3_action: "三拝(大礼)は3回 — 勝手に増やしたり減らしたりしない",
        item_C3_reason: "仏を敬い、教えに従い、僧伽に従うという3つの意味を込めた定められた回数です。",

        cat_D_title: "他の人への配慮",
        item_D1_action: "礼拝している人の前を横切らない",
        item_D1_reason: "修行の妨げにならないよう後ろを回ります。",
        item_D2_action: "僧侶と出会ったら合掌し半拝(腰を折るお辞儀は×)",
        item_D2_reason: "寺院での正しい挨拶の仕方です。",
        item_D3_action: "僧侶が食事・座禅・休憩中や早朝礼拝前のときは挨拶を省く",
        item_D3_reason: "邪魔にならないようにするためです。",
        item_D4_action: "僧侶と話すときは敬語を使い、手短に",
        item_D4_reason: "基本的なマナーです。",

        cat_E_title: "食堂(供養間)にて",
        item_E1_action: "食べられる分だけ盛る",
        item_E1_reason: "心を込めて用意された食事を残さないためです。",
        item_E2_action: "外部の食べ物を持ち込まない",
        item_E2_reason: "寺院で提供される食事だけをいただくのが原則です。",
        item_E3_action: "肉類・にんにく・ねぎなどの五辛は通常ありません",
        item_E3_reason: "知っておくとよい情報です。",

        cat_F_title: "法要に参加するとき",
        item_F1_action: "儀式集・筆記用具をあらかじめ準備",
        item_F2_action: "開始20〜30分前に到着、遅れた場合は静かに着席",
        item_F2_reason: "席を整える時間を確保するためです。",
        item_F3_action: "途中で立って退出しない",
        item_F3_reason: "失礼にあたる行動です。",

        cat_G_title: "退出するとき",
        item_G1_action: "ゴミは決められた場所へ、私物を忘れずに",
        item_G2_action: "静かに退出する",
        item_G2_reason: "入るときと同様です。",

        cat_H_title: "境内で常に守ること",
        item_H1_action: "飲酒・肉食・喫煙・大声での騒ぎは禁止",
        item_H2_action: "備え付けの物は大切に扱う"
    }
};

/* common.js가 언어 버튼 클릭 시 호출하는 훅. active 클래스 토글은 common.js가 처리함. */
function onLanguageChange(lang) {
    const t = TRANSLATIONS[lang];
    if (!t) return;

    if (window.applyManualOverrideTranslations) window.applyManualOverrideTranslations(lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) el.textContent = t[key];
    });
}

onLanguageChange('ko');
