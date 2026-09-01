/* home.html 전용 번역 사전. home.js의 window.onLanguageChange가 이 값을 사용함.
   기계번역(크롬 Translator API)이 마케팅 문구를 어색하게 옮기는 경우가 많아서
   이 페이지만 직접 손으로 번역해둠 - home.js보다 먼저 로드되어야 함. */

const HOME_TRANSLATIONS = {
    ko: {
        heroTitle: "처음 만나는 불교, 어렵지 않게",
        heroDescLine1: "불교와 사찰 문화를 처음 접하는 사람도 쉽게 알아보고, 찾고,",
        heroDescLine2: "준비하고, 직접 체험할 수 있는 공간입니다.",

        typeLabelLearn: "알아보기",
        learnTitleLine1: "불교를 처음",
        learnTitleLine2: "접하시나요?",
        learnLink1: "불교란?",
        learnLink2: "불교 용어",
        learnLink3: "사찰 음식",
        learnLink4: "오늘의 불교 한마디",

        typeLabelFind: "찾아보기",
        findTitleLine1: "어떤 사찰을",
        findTitleLine2: "찾고 계신가요?",
        findLink1: "사찰 찾아보기",
        findLink2: "불교 행사",

        typeLabelPrepare: "준비하기",
        prepareTitleLine1: "처음 가는 사찰,",
        prepareTitleLine2: "어렵지 않게.",
        prepareLink1: "사찰 예절 가이드",
        prepareLink2: "첫 방문 시뮬레이션",

        typeLabelExperience: "체험하기",
        experienceTitleLine1: "직접 불교 문화를",
        experienceTitleLine2: "경험해보세요.",
        experienceLink1: "템플스테이",
        experienceLink2: "온라인 목탁회",
        experienceLink3: "체험 후기",

        calendarSectionTitle: "월간 불교 행사",
        weekdaySun: "일", weekdayMon: "월", weekdayTue: "화", weekdayWed: "수",
        weekdayThu: "목", weekdayFri: "금", weekdaySat: "토",
        eventDetailLabel: "자세히 보기 →",
        noEventText: "등록된 불교 행사가 없습니다.",

        footerText: "사찰 관계자이신가요?",
        footerBtn: "문의하기"
    },
    ja: {
        heroTitle: "はじめての仏教、むずかしくない",
        heroDescLine1: "仏教や寺院文化に初めて触れる方でも気軽に知り、探し、",
        heroDescLine2: "準備し、直接体験できる空間です。",

        typeLabelLearn: "知る",
        learnTitleLine1: "仏教に触れるのは",
        learnTitleLine2: "初めてですか？",
        learnLink1: "仏教とは？",
        learnLink2: "仏教用語",
        learnLink3: "寺院料理",
        learnLink4: "今日の仏教の一言",

        typeLabelFind: "探す",
        findTitleLine1: "どんな寺院を",
        findTitleLine2: "お探しですか？",
        findLink1: "寺院を探す",
        findLink2: "仏教行事",

        typeLabelPrepare: "準備する",
        prepareTitleLine1: "初めての寺院訪問も",
        prepareTitleLine2: "むずかしくありません。",
        prepareLink1: "寺院参拝マナーガイド",
        prepareLink2: "初回訪問シミュレーション",

        typeLabelExperience: "体験する",
        experienceTitleLine1: "仏教文化を",
        experienceTitleLine2: "直接体験してみましょう。",
        experienceLink1: "テンプルステイ",
        experienceLink2: "オンライン木鐸会",
        experienceLink3: "体験レビュー",

        calendarSectionTitle: "月間仏教行事",
        weekdaySun: "日", weekdayMon: "月", weekdayTue: "火", weekdayWed: "水",
        weekdayThu: "木", weekdayFri: "金", weekdaySat: "土",
        eventDetailLabel: "詳しく見る →",
        noEventText: "登録された仏教行事がありません。",

        footerText: "寺院関係者の方ですか？",
        footerBtn: "お問い合わせ"
    },
    en: {
        heroTitle: "Discovering Buddhism, Made Simple",
        heroDescLine1: "A space where anyone new to Buddhism and temple culture can easily learn, explore,",
        heroDescLine2: "prepare, and experience it firsthand.",

        typeLabelLearn: "Learn",
        learnTitleLine1: "New to",
        learnTitleLine2: "Buddhism?",
        learnLink1: "What is Buddhism?",
        learnLink2: "Buddhist Terms",
        learnLink3: "Temple Food",
        learnLink4: "Buddhist Quote of the Day",

        typeLabelFind: "Explore",
        findTitleLine1: "Which temple are",
        findTitleLine2: "you looking for?",
        findLink1: "Find a Temple",
        findLink2: "Buddhist Events",

        typeLabelPrepare: "Prepare",
        prepareTitleLine1: "Visiting a temple for the first time?",
        prepareTitleLine2: "It's easier than you think.",
        prepareLink1: "Temple Etiquette Guide",
        prepareLink2: "First Visit Simulation",

        typeLabelExperience: "Experience",
        experienceTitleLine1: "Experience Buddhist culture",
        experienceTitleLine2: "for yourself.",
        experienceLink1: "Templestay",
        experienceLink2: "Online Moktak Gathering",
        experienceLink3: "Experience Reviews",

        calendarSectionTitle: "Monthly Buddhist Events",
        weekdaySun: "Sun", weekdayMon: "Mon", weekdayTue: "Tue", weekdayWed: "Wed",
        weekdayThu: "Thu", weekdayFri: "Fri", weekdaySat: "Sat",
        eventDetailLabel: "Learn more →",
        noEventText: "No Buddhist events registered.",

        footerText: "Are you a temple representative?",
        footerBtn: "Contact Us"
    }
};

const HOME_ARIA_TRANSLATIONS = {
    ko: { prevMonth: "이전 달", nextMonth: "다음 달", backToTop: "페이지 위로 이동" },
    ja: { prevMonth: "前の月", nextMonth: "次の月", backToTop: "ページ上部へ移動" },
    en: { prevMonth: "Previous month", nextMonth: "Next month", backToTop: "Back to top" }
};
