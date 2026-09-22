/* ============================================================
   programI18n.js - 프로그램 목록·예약(reservation.html) / 프로그램 상세(programDetail.html) /
                    전체 후기(reviews.html) / 불교 행사(events.html) 페이지 공용 사전 번역
   ------------------------------------------------------------
   이 두 페이지는 언어 함수(onLanguageChange)가 따로 없어 common.js의 기본 번역 경로(크롬 번역기)를
   타는데, 지역명/프로그램 유형처럼 정해진 값은 기계번역이 어색해서 여기 사전으로 직접 번역한다.
   서버 값(value, 필터 비교)은 항상 한국어 원문을 쓰고, 화면에 보이는 글자만 바꾼다.

   사전에 없는 값(새 지역 등)은 원문(한글)을 그대로 돌려줘서 안 깨진다 - 그 부분만 기계번역이 처리.
   사찰명은 사찰찾기와 같은 사전(templeI18n.js)을 그대로 재사용한다.
============================================================ */

const PROGRAM_I18N = {
    // TEMPLE.region 실제 저장값(짧은 표기) + 아직 사찰이 없는 대전/울산
    region: {
        '강원': { ja: '江原道', en: 'Gangwon' },
        '경기': { ja: '京畿道', en: 'Gyeonggi' },
        '경남': { ja: '慶尚南道', en: 'South Gyeongsang' },
        '경북': { ja: '慶尚北道', en: 'North Gyeongsang' },
        '광주': { ja: '光州', en: 'Gwangju' },
        '대구': { ja: '大邱', en: 'Daegu' },
        '대전': { ja: '大田', en: 'Daejeon' },
        '부산': { ja: '釜山', en: 'Busan' },
        '서울': { ja: 'ソウル', en: 'Seoul' },
        '세종': { ja: '世宗', en: 'Sejong' },
        '울산': { ja: '蔚山', en: 'Ulsan' },
        '인천': { ja: '仁川', en: 'Incheon' },
        '전남': { ja: '全羅南道', en: 'South Jeolla' },
        '전북': { ja: '全羅北道', en: 'North Jeolla' },
        '제주': { ja: '済州', en: 'Jeju' },
        '충남': { ja: '忠清南道', en: 'South Chungcheong' },
        '충북': { ja: '忠清北道', en: 'North Chungcheong' }
    },
    // 영어는 템플스테이 가이드 페이지(templestayGuide.i18n.js)의 태그(EXPERIENCE/REST/DAY VISIT)와 맞춤
    type: {
        '당일형': { ja: '当日型', en: 'Day Visit' },
        '체험형': { ja: '体験型', en: 'Experience' },
        '휴식형': { ja: '休息型', en: 'Rest' }
    },
    ui: {
        ko: {
            filterRegion: '지역', filterTemple: '사찰', filterType: '프로그램 유형', filterLanguage: '언어', filterHeadcount: '인원',
            all: '전체', supportEnglish: '영어 지원',
            programList: '프로그램 목록', noProgram: '조건에 맞는 프로그램이 없습니다.',
            detailPageTitle: '프로그램 상세보기', backToList: '← 목록으로',
            detailIntro: '프로그램 소개', detailLocation: '위치', detailSchedule: '일정표', detailItems: '준비물',
            detailPrice: '요금 안내', detailPriceType: '구분', detailPricePrice: '가격', detailPerPerson: '1인',
            detailNotes: '유의사항', detailRefund: '환불 규정',
            reserveBtn: '예약 신청', fullBtn: '정원이 마감되었습니다',
            priceNote: '(성인 가격 기준)', dateLabel: '날짜',

            // ---- 전체 후기(reviews) ----
            revPageTitle: '템플스테이 후기', revBack: '← 템플스테이 예약', revLoadingMsg: '후기를 불러오는 중입니다…',
            revSortAria: '정렬', sortLatest: '최신순', sortOldest: '오래된순', sortRatingDesc: '별점 높은순', sortRatingAsc: '별점 낮은순',
            revSearchPh: '사찰명 · 프로그램명 · 작성자 · 내용 검색', revSearchBtn: '검색',
            revMore: '자세히', revCollapse: '접기',
            revTempleName: '사찰명', revRating: '별점', revAuthor: '작성자', revDate: '작성일', revContent: '내용',
            revEdit: '수정하기', revDelete: '삭제하기', revNoTitle: '(제목 없음)', revNoContent: '(내용 없음)',
            revNoResult: '검색 결과가 없습니다.', revNoReviews: '등록된 후기가 없습니다.',
            revLoading: '후기를 불러오는 중...', revDeleting: '삭제하는 중...',
            revConfirmDelete: '이 리뷰를 삭제하시겠습니까?', revDeleted: '리뷰가 삭제되었습니다.',
            revErrDelete: '리뷰 삭제 중 오류가 발생했습니다.', revErrLike: '좋아요 처리 중 오류가 발생했습니다.',
            revErrLoad: '후기 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',

            // ---- 불교 행사(events) ----
            evTitle: '불교 행사', evLead: '박람회·법회·전통문화 행사 등 전국 사찰에서 열리는 불교 행사를 모았습니다.',
            evSearchPh: '행사 이름이나 사찰 이름으로 검색 (예: 박람회, 조계사...)',
            evNone: '아직 등록된 행사가 없습니다.', evNoResult: '검색 결과가 없습니다.',
            evPast: '종료', evLink: '자세히 보기 →', evMyFavorites: '관심 행사 모아보기 →',

            // ---- 예약 신청(step 2) ----
            rsvTitle: '예약 신청', rsvWhen: '희망 일정', rsvPickDate: '날짜를 선택해 주세요.',
            rsvHeadcount: '참가 인원', rsvNote: '요청사항',
            rsvNotePh: '예) 채식 식단이 필요합니다 / 거동이 불편하여 1층 방을 희망합니다 / 반려동물 동반 문의 등 요청사항을 자유롭게 적어주세요',
            repInfo: '대표자 정보', name: '이름', gender: '성별', genderSelect: '선택', male: '남성', female: '여성',
            email: '이메일', emailPh: '예) abc123@example.com', phone: '연락처', phonePh: '예) 01012345678',
            participantInfo: '참가자 정보', participantHint: '대표자를 제외한 나머지 참가자 정보를 입력해 주세요.',
            paySection: '결제 수단', payMethod: '결제 방법', bankTransfer: '계좌이체', kakaoPay: '카카오페이',
            depositor: '입금자명', backBtn: '이전', submitBtn: '예약 및 결제 신청', processing: '처리 중...',
            selectedDate: '선택한 날짜:', dayTrip: '(당일)', overnight: '(1박2일)',
            // ---- 신청 완료(step 3) ----
            doneTitle: '신청 완료', appliedAt: '신청 일시', programName: '프로그램명', resultHeadcount: '인원수',
            totalAmount: '결제 금액', statusLabel: '예약 상태', toList: '목록으로', goMyRes: '내 예약 확인하기',
            reservationNo: '예약번호', noParticipantInfo: '참가자 정보 없음',
            statusPending: '예약대기', statusConfirmed: '예약확정', statusCanceled: '취소', statusDone: '이용완료',
            // ---- 알림/확인창(브라우저 대화상자는 번역기가 못 건드려서 여기서 직접 번역) ----
            loginRequired: '로그인이 필요합니다.',
            alertPaying: '결제가 진행 중입니다. 잠시만 기다려 주세요.',
            alertPickStart: '시작일을 선택해 주세요.',
            alertFillAll: '대표자와 참가자 정보를 모두 입력해 주세요.',
            alertRepPhone: '대표자 연락처를 입력해 주세요.',
            confirmTitle: '아래 내용으로 예약하시겠습니까?', cProgram: '프로그램', cTemple: '사찰', cPeriod: '기간',
            cHeadcount: '인원', cPayMethod: '결제 수단', cDepositor: '입금자명', cNotEntered: '(미입력)', cTotal: '총 금액',
            loadingReserve: '예약을 처리하는 중...',
            failReserve: '예약 신청에 실패했습니다.', failParticipants: '참가자 정보 등록에 실패했습니다.',
            failKakaoReady: '카카오페이 결제 준비에 실패했습니다.', failPayment: '결제 정보 등록에 실패했습니다.',
            failGeneric: '예약 신청 중 오류가 발생했습니다.',
            payCanceled: '결제를 취소했습니다. 예약도 함께 취소되었습니다.',
            payFailed: '결제에 실패했습니다. 예약도 함께 취소되었습니다.',
            payDoneNoResult: '결제는 완료됐지만 결과를 불러오지 못했습니다. 마이페이지에서 예약 내역을 확인해 주세요.'
        },
        ja: {
            filterRegion: '地域', filterTemple: '寺院', filterType: 'プログラム種別', filterLanguage: '言語', filterHeadcount: '人数',
            all: 'すべて', supportEnglish: '英語対応',
            programList: 'プログラム一覧', noProgram: '条件に合うプログラムがありません。',
            detailPageTitle: 'プログラム詳細', backToList: '← 一覧へ',
            detailIntro: 'プログラム紹介', detailLocation: '場所', detailSchedule: 'スケジュール', detailItems: '持ち物',
            detailPrice: '料金案内', detailPriceType: '区分', detailPricePrice: '料金', detailPerPerson: '1名',
            detailNotes: '注意事項', detailRefund: '返金規定',
            reserveBtn: '予約申込', fullBtn: '定員に達しました',
            priceNote: '(大人料金基準)', dateLabel: '日付',

            revPageTitle: 'テンプルステイのレビュー', revBack: '← テンプルステイ予約', revLoadingMsg: 'レビューを読み込んでいます…',
            revSortAria: '並べ替え', sortLatest: '新しい順', sortOldest: '古い順', sortRatingDesc: '評価が高い順', sortRatingAsc: '評価が低い順',
            revSearchPh: '寺院名・プログラム名・投稿者・内容で検索', revSearchBtn: '検索',
            revMore: '詳細', revCollapse: '閉じる',
            revTempleName: '寺院名', revRating: '評価', revAuthor: '投稿者', revDate: '投稿日', revContent: '内容',
            revEdit: '修正する', revDelete: '削除する', revNoTitle: '(タイトルなし)', revNoContent: '(内容なし)',
            revNoResult: '検索結果がありません。', revNoReviews: '登録されたレビューがありません。',
            revLoading: 'レビューを読み込んでいます...', revDeleting: '削除しています...',
            revConfirmDelete: 'このレビューを削除しますか？', revDeleted: 'レビューを削除しました。',
            revErrDelete: 'レビューの削除中にエラーが発生しました。', revErrLike: 'いいねの処理中にエラーが発生しました。',
            revErrLoad: 'レビュー一覧を読み込めませんでした。しばらくしてからもう一度お試しください。',

            evTitle: '仏教行事', evLead: '博覧会・法会・伝統文化行事など、全国の寺院で開かれる仏教行事をまとめました。',
            evSearchPh: '行事名や寺院名で検索(例: 博覧会、曹渓寺...)',
            evNone: 'まだ登録された行事がありません。', evNoResult: '検索結果がありません。',
            evPast: '終了', evLink: '詳しく見る →', evMyFavorites: 'お気に入りの行事を見る →',

            rsvTitle: '予約申込', rsvWhen: 'ご希望の日程', rsvPickDate: '日付を選択してください。',
            rsvHeadcount: '参加人数', rsvNote: 'ご要望',
            rsvNotePh: '例）ベジタリアン食が必要です / 足が不自由なため1階のお部屋を希望します / ペット同伴のご相談など、ご要望を自由にご記入ください',
            repInfo: '代表者情報', name: '氏名', gender: '性別', genderSelect: '選択', male: '男性', female: '女性',
            email: 'メールアドレス', emailPh: '例）abc123@example.com', phone: '連絡先', phonePh: '例）01012345678',
            participantInfo: '参加者情報', participantHint: '代表者以外の参加者の情報を入力してください。',
            paySection: '決済手段', payMethod: 'お支払い方法', bankTransfer: '銀行振込', kakaoPay: 'カカオペイ',
            depositor: '入金者名', backBtn: '戻る', submitBtn: '予約・決済を申し込む', processing: '処理中...',
            selectedDate: '選択した日付:', dayTrip: '(日帰り)', overnight: '(1泊2日)',
            doneTitle: '申込完了', appliedAt: '申込日時', programName: 'プログラム名', resultHeadcount: '人数',
            totalAmount: 'お支払い金額', statusLabel: '予約状況', toList: '一覧へ', goMyRes: '予約を確認する',
            reservationNo: '予約番号', noParticipantInfo: '参加者情報なし',
            statusPending: '予約待ち', statusConfirmed: '予約確定', statusCanceled: 'キャンセル', statusDone: '利用済み',
            loginRequired: 'ログインが必要です。',
            alertPaying: '決済を処理中です。しばらくお待ちください。',
            alertPickStart: '開始日を選択してください。',
            alertFillAll: '代表者と参加者の情報をすべて入力してください。',
            alertRepPhone: '代表者の連絡先を入力してください。',
            confirmTitle: '以下の内容で予約しますか？', cProgram: 'プログラム', cTemple: '寺院', cPeriod: '期間',
            cHeadcount: '人数', cPayMethod: '決済手段', cDepositor: '入金者名', cNotEntered: '(未入力)', cTotal: '合計金額',
            loadingReserve: '予約を処理しています...',
            failReserve: '予約の申込に失敗しました。', failParticipants: '参加者情報の登録に失敗しました。',
            failKakaoReady: 'カカオペイの決済準備に失敗しました。', failPayment: '決済情報の登録に失敗しました。',
            failGeneric: '予約の申込中にエラーが発生しました。',
            payCanceled: '決済をキャンセルしました。予約もキャンセルされました。',
            payFailed: '決済に失敗しました。予約もキャンセルされました。',
            payDoneNoResult: '決済は完了しましたが、結果を読み込めませんでした。マイページで予約履歴をご確認ください。'
        },
        en: {
            filterRegion: 'Region', filterTemple: 'Temple', filterType: 'Program Type', filterLanguage: 'Language', filterHeadcount: 'Participants',
            all: 'All', supportEnglish: 'English Support',
            programList: 'Program List', noProgram: 'No programs match your filters.',
            detailPageTitle: 'Program Details', backToList: '← Back to list',
            detailIntro: 'About the Program', detailLocation: 'Location', detailSchedule: 'Schedule', detailItems: 'What to Bring',
            detailPrice: 'Pricing', detailPriceType: 'Type', detailPricePrice: 'Price', detailPerPerson: 'Per person',
            detailNotes: 'Notes', detailRefund: 'Refund Policy',
            reserveBtn: 'Reserve', fullBtn: 'Fully booked',
            priceNote: '(per adult)', dateLabel: 'Date',

            revPageTitle: 'Templestay Reviews', revBack: '← Templestay Reservation', revLoadingMsg: 'Loading reviews…',
            revSortAria: 'Sort', sortLatest: 'Newest', sortOldest: 'Oldest', sortRatingDesc: 'Highest rated', sortRatingAsc: 'Lowest rated',
            revSearchPh: 'Search by temple, program, author, or content', revSearchBtn: 'Search',
            revMore: 'Details', revCollapse: 'Collapse',
            revTempleName: 'Temple', revRating: 'Rating', revAuthor: 'Author', revDate: 'Date', revContent: 'Content',
            revEdit: 'Edit', revDelete: 'Delete', revNoTitle: '(No title)', revNoContent: '(No content)',
            revNoResult: 'No results were found for your search.', revNoReviews: 'No reviews have been registered yet.',
            revLoading: 'Loading reviews...', revDeleting: 'Deleting...',
            revConfirmDelete: 'Are you sure you want to delete this review?', revDeleted: 'The review has been deleted.',
            revErrDelete: 'An error occurred while deleting the review.', revErrLike: 'An error occurred while processing your like.',
            revErrLoad: 'Could not load the reviews. Please try again in a moment.',

            evTitle: 'Buddhist Events', evLead: 'Expos, dharma assemblies, traditional culture events, and more Buddhist events held at temples across the country.',
            evSearchPh: 'Search by event or temple name (e.g. expo, Jogyesa...)',
            evNone: 'No events have been registered yet.', evNoResult: 'No results were found for your search.',
            evPast: 'Ended', evLink: 'Learn more →', evMyFavorites: 'View my favorite events →',

            rsvTitle: 'Reservation Request', rsvWhen: 'Preferred Dates', rsvPickDate: 'Please select a date.',
            rsvHeadcount: 'Number of Participants', rsvNote: 'Requests',
            rsvNotePh: 'e.g. I need a vegetarian meal / I would like a ground-floor room due to limited mobility / Questions about bringing a pet, etc. Feel free to write any requests',
            repInfo: 'Representative Information', name: 'Name', gender: 'Gender', genderSelect: 'Select', male: 'Male', female: 'Female',
            email: 'Email', emailPh: 'e.g. abc123@example.com', phone: 'Phone', phonePh: 'e.g. 01012345678',
            participantInfo: 'Participant Information', participantHint: 'Please enter the information of the other participants (excluding the representative).',
            paySection: 'Payment', payMethod: 'Payment Method', bankTransfer: 'Bank Transfer', kakaoPay: 'KakaoPay',
            depositor: 'Depositor Name', backBtn: 'Back', submitBtn: 'Reserve and Pay', processing: 'Processing...',
            selectedDate: 'Selected date:', dayTrip: '(day trip)', overnight: '(1 night, 2 days)',
            doneTitle: 'Request Complete', appliedAt: 'Requested At', programName: 'Program', resultHeadcount: 'Participants',
            totalAmount: 'Total Amount', statusLabel: 'Status', toList: 'Back to List', goMyRes: 'View My Reservations',
            reservationNo: 'Reservation No.', noParticipantInfo: 'No participant information',
            statusPending: 'Pending', statusConfirmed: 'Confirmed', statusCanceled: 'Canceled', statusDone: 'Completed',
            loginRequired: 'Login is required.',
            alertPaying: 'Your payment is being processed. Please wait a moment.',
            alertPickStart: 'Please select a start date.',
            alertFillAll: 'Please fill in the information for the representative and all participants.',
            alertRepPhone: "Please enter the representative's phone number.",
            confirmTitle: 'Would you like to reserve with the details below?', cProgram: 'Program', cTemple: 'Temple', cPeriod: 'Period',
            cHeadcount: 'Participants', cPayMethod: 'Payment method', cDepositor: 'Depositor name', cNotEntered: '(not entered)', cTotal: 'Total',
            loadingReserve: 'Processing your reservation...',
            failReserve: 'Failed to submit the reservation.', failParticipants: 'Failed to register the participant information.',
            failKakaoReady: 'Failed to prepare the KakaoPay payment.', failPayment: 'Failed to register the payment information.',
            failGeneric: 'An error occurred while submitting the reservation.',
            payCanceled: 'The payment was canceled. The reservation has also been canceled.',
            payFailed: 'The payment failed. The reservation has also been canceled.',
            payDoneNoResult: 'The payment was completed but the result could not be loaded. Please check your reservations on My Page.'
        }
    }
};

function piLang() {
    return (typeof i18nCurrentLang !== 'undefined') ? i18nCurrentLang : 'ko';
}

function trRegion(region) {
    var e = PROGRAM_I18N.region[region], lang = piLang();
    return (lang !== 'ko' && e && e[lang]) ? e[lang] : region;
}

function trType(type) {
    var e = PROGRAM_I18N.type[type], lang = piLang();
    return (lang !== 'ko' && e && e[lang]) ? e[lang] : type;
}

/** 사찰명은 사찰찾기와 같은 사전(templeI18n.js) - 없으면 원문 */
function trTempleName(name) {
    return (typeof translateTempleName === 'function') ? translateTempleName(name, piLang()) : name;
}

function trUi(key) {
    var t = PROGRAM_I18N.ui[piLang()] || PROGRAM_I18N.ui.ko;
    return t[key] !== undefined ? t[key] : PROGRAM_I18N.ui.ko[key];
}

function trPeople(n) {
    var lang = piLang();
    return lang === 'ja' ? n + '名' : lang === 'en' ? n + (n === 1 ? ' person' : ' people') : n + '명';
}

function trWon(n) {
    var s = n.toLocaleString(), lang = piLang();
    return lang === 'ja' ? s + 'ウォン' : lang === 'en' ? 'KRW ' + s : s + '원';
}

/** 서버에 보내는 값(value)은 한국어 원문 그대로 두고, 화면에 보이는 글자만 바꾸는 값 번역들 */
function trGender(v) { return v === '남성' ? trUi('male') : v === '여성' ? trUi('female') : v; }
function trPayMethod(v) { return v === '계좌이체' ? trUi('bankTransfer') : v === '카카오페이' ? trUi('kakaoPay') : v; }
function trStatus(v) {
    var key = { '예약대기': 'statusPending', '예약확정': 'statusConfirmed', '취소': 'statusCanceled', '이용완료': 'statusDone' }[v];
    return key ? trUi(key) : v;
}

/** 당일이면 "2026-09-25 (당일)", 아니면 "2026-09-25 ~ 2026-09-26" */
function trDateRange(start, end) {
    return start === end ? start + ' ' + trUi('dayTrip') : start + ' ~ ' + end;
}

/** 달력 제목: ko "2026년 9월" / ja "2026年9月" / en "September 2026" (month0은 0~11) */
var PI_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function trMonthLabel(year, month0) {
    var lang = piLang();
    return lang === 'ja' ? year + '年' + (month0 + 1) + '月'
         : lang === 'en' ? PI_MONTHS_EN[month0] + ' ' + year
         : year + '년 ' + (month0 + 1) + '월';
}

/** 달력 요일 머리글(일~토) */
function trWeekdays() {
    var lang = piLang();
    return lang === 'ja' ? ['日', '月', '火', '水', '木', '金', '土']
         : lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
         : ['일', '월', '화', '수', '목', '금', '토'];
}

/** 사찰명 · 지역 (사찰명은 사찰찾기 사전, 지역은 위 사전) */
function trTempleRegion(templeName, region) {
    return trTempleName(templeName) + ' · ' + trRegion(region);
}

/** HTML에 data-pi18n="키" / data-pi18n-type="당일형"이 붙은 고정 요소를 지금 언어 사전 값으로 채움.
    common.js의 MutationObserver가 이 글자를 다시 번역기에 넘기지 않도록 .no-translate도 붙인다. */
function applyProgramStaticI18n() {
    document.querySelectorAll('[data-pi18n]').forEach(function (el) {
        el.classList.add('no-translate');
        el.textContent = trUi(el.getAttribute('data-pi18n'));
    });
    document.querySelectorAll('[data-pi18n-type]').forEach(function (el) {
        el.classList.add('no-translate');
        el.textContent = trType(el.getAttribute('data-pi18n-type'));
    });
    // 접근성 라벨(aria-label)은 속성이라 번역기가 안 건드리지만 언어가 바뀌면 같이 맞춘다
    document.querySelectorAll('[data-pi18n-aria]').forEach(function (el) {
        el.setAttribute('aria-label', trUi(el.getAttribute('data-pi18n-aria')));
    });
    // 사찰명: 사찰찾기와 같은 사전(templeI18n.js)에 있는 사찰만 영문/가타카나로 바꾼다.
    // 사전에 없는 사찰은 건드리지 않아서(번역기에 맡김) 그 자리에 번역기 결과가 그대로 남는다.
    document.querySelectorAll('[data-pi18n-temple]').forEach(function (el) {
        var name = el.getAttribute('data-pi18n-temple');
        var translated = trTempleName(name);
        if (translated !== name) {
            el.classList.add('no-translate');
            el.textContent = translated;
        } else if (piLang() === 'ko') {
            // 한국어로 되돌릴 때는 사전으로 바꿔뒀던 자리만 원문으로 복원(번역기 자리는 common.js가 복원함)
            if (el.classList.contains('no-translate') && el.textContent !== name) el.textContent = name;
        }
    });
    // 입력칸 안내문(placeholder)은 속성이라 텍스트 노드가 아니지만, common.js가 placeholder도
    // 번역 대상으로 수집하므로 .no-translate로 같이 보호한다
    document.querySelectorAll('[data-pi18n-placeholder]').forEach(function (el) {
        el.classList.add('no-translate');
        el.placeholder = trUi(el.getAttribute('data-pi18n-placeholder'));
    });
}

// 번역기가 텍스트를 다 적용한 뒤(common.js가 부름) 사전 값으로 다시 덮음. 각 페이지는
// window.onProgramI18nRefresh에 자기 동적 렌더링(필터 옵션/카드 등) 다시 그리기를 등록한다.
window.i18nAfterApplyHooks = window.i18nAfterApplyHooks || [];
window.i18nAfterApplyHooks.push(function () {
    applyProgramStaticI18n();
    if (typeof window.onProgramI18nRefresh === 'function') window.onProgramI18nRefresh();
});

// 첫 화면부터 번역기 대상에서 빠지도록 미리 표시(언어를 바꾸기 전엔 텍스트는 그대로 한글)
document.querySelectorAll('[data-pi18n], [data-pi18n-type], [data-pi18n-placeholder]').forEach(function (el) {
    el.classList.add('no-translate');
});
