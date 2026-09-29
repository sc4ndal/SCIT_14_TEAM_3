/* ============================================================
   inquiryI18n.js - 문의 관련 8개 화면(마이페이지 1:1 문의, 사찰 문의,
   사찰 관리자의 문의 목록/답변)이 같이 쓰는 사전형 번역.
   ------------------------------------------------------------
   화면 자체는 서버가 렌더링(th:text)하므로 programI18n.js처럼 JS가
   카드를 새로 그리는 구조는 아니고, 페이지에 이미 박혀있는 고정 문구
   (제목/버튼/안내문/상태 배지 등)만 언어 전환 시 dictionary 값으로
   바꿔치기한다. 문의 제목/내용처럼 회원이 직접 쓴 글은 사전에 없으니
   common.js의 크롬 번역기(defaultOnLanguageChange)가 그대로 담당한다
   - 그래서 이 사전이 다루는 요소에는 .no-translate를 같이 붙여서
   크롬 번역기가 먼저 건드리지 않게 하고, 아래 applyInquiryStaticI18n()을
   window.i18nAfterApplyHooks에 등록해 크롬 번역이 끝난 뒤 이어서
   실행되게 한다(programI18n.js와 동일한 패턴).
   ============================================================ */

const INQUIRY_I18N = {
    ui: {
        ko: {
            // ---- 공통 ----
            backToList: '← 목록으로',
            inquiryContentLabel: '문의 내용',
            noAnswerYet: '아직 답변이 등록되지 않았습니다.',
            answeredAtPrefix: '답변일 ',
            titleLabel: '제목',
            contentLabel: '내용',
            cancelBtn: '취소',
            submitInquiryBtn: '문의 등록',
            submitAnswerBtn: '답변 등록',
            answerFormLabel: '답변 작성',
            statusWaiting: '대기',
            statusAnswered: '답변완료',
            inquiryReceived: '문의가 접수되었습니다.',

            // ---- 마이페이지 1:1 문의 목록 (inquiryList.html) ----
            myListTitle: '1:1 문의',
            myListSubtitle: '궁금하신 점을 남겨주시면 관리자가 확인 후 답변드립니다.',
            writeBtn: '문의 작성',
            myListEmpty: '작성한 문의가 없습니다.',
            myListEmptyLink: '문의 작성하러 가기 →',

            // ---- 마이페이지 1:1 문의 상세 (inquiryDetail.html) ----
            myDetailHeroLabel: '문의',
            myDetailAnswerHeader: '관리자 답변',

            // ---- 1:1 문의 작성 (inquiryWrite.html) ----
            writeTitle: '무엇을 도와드릴까요?',
            writeDesc: '닉네임 변경, 불편사항, 개선 제안 등 궁금하신 점을 남겨주시면<br>사이트 관리자가 확인 후 답변드립니다.',
            writeTitlePh: '문의 제목을 입력해주세요',
            writeContentPh: '문의하실 내용을 자세히 작성해주시면 더 정확한 답변을 드릴 수 있습니다.',

            // ---- 사찰 문의 목록 (templeInquiryList.html) ----
            templeListTitle: '사찰 문의',
            templeListSubtitle: '예약 관련 문의(취소 요청 등)는 예약목록 > 예약상세 > "사찰에 문의하기"에서 남길 수 있습니다.',
            templeListEmpty: '사찰에 남긴 문의가 없습니다.',
            templeListEmptyLink: '예약목록 보러가기 →',

            // ---- 사찰 문의 상세 (templeInquiryDetail.html) ----
            templeDetailHeroSuffix: ' 문의',
            templeDetailReservationPrefix: '관련 예약번호 #',
            templeDetailAnswerHeader: '사찰 답변',

            // ---- 사찰에 문의하기 작성 (templeInquiryWrite.html) ----
            templeWriteTitle: '사찰에 문의하기',
            templeWriteDesc: '예약 취소 기한(24시간 전)이 지났거나 그 외 요청사항이 있으면 사찰에 직접 남겨주세요.<br>사찰이 확인 후 답변드립니다.',
            templeWriteRefPrefix: '관련 예약번호: #',
            templeWriteTitlePh: '예: 예약 취소 요청',
            templeWriteContentPh: '취소를 원하시는 이유 등을 자세히 작성해주시면 더 빠르게 처리해드릴 수 있습니다.',

            // ---- 사이트 관리자 - 문의 목록/상세 (admin/inquiryList.html, admin/inquiryDetail.html) ----
            adminListTitle: '문의 목록',
            adminListSubtitle: '일반회원이 남긴 1:1 문의입니다. 답변 대기중인 문의가 먼저 표시됩니다.',
            adminDetailHeroLabel: '문의 상세',

            // ---- 사찰 관리자 - 문의 목록 (templeInquiryManageList.html) ----
            manageListTitle: '사찰 문의 목록',
            manageListSubtitle: '회원이 이 사찰로 남긴 1:1 문의입니다(예약 취소 요청 등). 답변 대기중인 문의가 먼저 표시됩니다.',
            manageListEmpty: '접수된 문의가 없습니다.',
            manageListReservationSuffix: ' · 예약번호 #',

            // ---- 사찰 관리자 - 문의 상세/답변 (templeInquiryManageDetail.html) ----
            manageDetailAnswerSaved: '답변이 등록되었습니다.',
            manageDetailHeroLabel: '사찰 문의 상세',
            manageDetailReservationPrefix: '관련 예약: ',
            manageDetailAnswerHeader: '답변',
            manageDetailAnswerPh: '문의하신 내용에 대한 답변을 작성해주세요.'
        },
        ja: {
            backToList: '← 一覧へ',
            inquiryContentLabel: 'お問い合わせ内容',
            noAnswerYet: 'まだ回答が登録されていません。',
            answeredAtPrefix: '回答日 ',
            titleLabel: 'タイトル',
            contentLabel: '内容',
            cancelBtn: 'キャンセル',
            submitInquiryBtn: '問い合わせを登録',
            submitAnswerBtn: '回答を登録',
            answerFormLabel: '回答を作成',
            statusWaiting: '待機中',
            statusAnswered: '回答済み',
            inquiryReceived: 'お問い合わせを受け付けました。',

            myListTitle: '1:1お問い合わせ',
            myListSubtitle: '気になる点を残していただければ、管理者が確認のうえ回答いたします。',
            writeBtn: '問い合わせを作成',
            myListEmpty: '作成したお問い合わせがありません。',
            myListEmptyLink: '問い合わせを作成する →',

            myDetailHeroLabel: 'お問い合わせ',
            myDetailAnswerHeader: '管理者の回答',

            writeTitle: '何かお困りですか？',
            writeDesc: 'ニックネーム変更、不具合、改善提案など気になる点を残していただければ<br>サイト管理者が確認のうえ回答いたします。',
            writeTitlePh: '問い合わせのタイトルを入力してください',
            writeContentPh: 'お問い合わせ内容を詳しく書いていただくと、より正確な回答ができます。',

            templeListTitle: '寺院への問い合わせ',
            templeListSubtitle: '予約関連のお問い合わせ(キャンセル依頼など)は、予約リスト > 予約詳細 > 「寺院に問い合わせる」から残せます。',
            templeListEmpty: '寺院に残した問い合わせがありません。',
            templeListEmptyLink: '予約リストを見る →',

            templeDetailHeroSuffix: 'への問い合わせ',
            templeDetailReservationPrefix: '関連予約番号 #',
            templeDetailAnswerHeader: '寺院の回答',

            templeWriteTitle: '寺院に問い合わせる',
            templeWriteDesc: '予約キャンセル期限(24時間前)を過ぎた場合やその他ご要望がありましたら、寺院に直接お伝えください。<br>寺院が確認のうえ回答いたします。',
            templeWriteRefPrefix: '関連予約番号: #',
            templeWriteTitlePh: '例: 予約キャンセルのお願い',
            templeWriteContentPh: 'キャンセルを希望する理由などを詳しく書いていただくと、より早く対応できます。',

            adminListTitle: 'お問い合わせ一覧',
            adminListSubtitle: '一般会員が残した1:1お問い合わせです。回答待ちのお問い合わせが先に表示されます。',
            adminDetailHeroLabel: 'お問い合わせ詳細',

            manageListTitle: '寺院への問い合わせ一覧',
            manageListSubtitle: '会員がこの寺院に残した1:1お問い合わせです(予約キャンセル依頼など)。回答待ちのお問い合わせが先に表示されます。',
            manageListEmpty: '受け付けたお問い合わせがありません。',
            manageListReservationSuffix: ' ・ 予約番号 #',

            manageDetailAnswerSaved: '回答が登録されました。',
            manageDetailHeroLabel: '寺院への問い合わせ詳細',
            manageDetailReservationPrefix: '関連予約: ',
            manageDetailAnswerHeader: '回答',
            manageDetailAnswerPh: 'お問い合わせ内容への回答を作成してください。'
        },
        en: {
            backToList: '← Back to list',
            inquiryContentLabel: 'Inquiry Details',
            noAnswerYet: 'No answer has been posted yet.',
            answeredAtPrefix: 'Answered on ',
            titleLabel: 'Title',
            contentLabel: 'Content',
            cancelBtn: 'Cancel',
            submitInquiryBtn: 'Submit Inquiry',
            submitAnswerBtn: 'Submit Answer',
            answerFormLabel: 'Write an Answer',
            statusWaiting: 'Pending',
            statusAnswered: 'Answered',
            inquiryReceived: 'Your inquiry has been received.',

            myListTitle: '1:1 Inquiries',
            myListSubtitle: 'Leave us a question and our admin will review and respond.',
            writeBtn: 'New Inquiry',
            myListEmpty: 'You haven’t submitted any inquiries yet.',
            myListEmptyLink: 'Write an inquiry →',

            myDetailHeroLabel: 'Inquiry',
            myDetailAnswerHeader: 'Admin’s Answer',

            writeTitle: 'How can we help?',
            writeDesc: 'Leave us a question about nickname changes, issues, suggestions, and more<br>and our site admin will review and respond.',
            writeTitlePh: 'Enter the inquiry title',
            writeContentPh: 'Write your inquiry in detail so we can give you a more accurate answer.',

            templeListTitle: 'Temple Inquiries',
            templeListSubtitle: 'For reservation-related inquiries (like cancellation requests), use "Contact the Temple" under My Reservations > Reservation Details.',
            templeListEmpty: 'You haven’t left any inquiries to a temple.',
            templeListEmptyLink: 'View my reservations →',

            templeDetailHeroSuffix: ' Inquiry',
            templeDetailReservationPrefix: 'Related Reservation #',
            templeDetailAnswerHeader: 'Temple’s Answer',

            templeWriteTitle: 'Contact the Temple',
            templeWriteDesc: 'If the cancellation deadline (24 hours before) has passed or you have another request, please let the temple know directly.<br>The temple will review and respond.',
            templeWriteRefPrefix: 'Related Reservation: #',
            templeWriteTitlePh: 'e.g. Cancellation request',
            templeWriteContentPh: 'Describe your reason for canceling in detail so we can process it faster.',

            adminListTitle: 'Inquiries',
            adminListSubtitle: '1:1 inquiries submitted by members. Pending inquiries are shown first.',
            adminDetailHeroLabel: 'Inquiry Details',

            manageListTitle: 'Temple Inquiries',
            manageListSubtitle: '1:1 inquiries members have left for this temple (cancellation requests, etc.). Pending inquiries are shown first.',
            manageListEmpty: 'No inquiries have been received.',
            manageListReservationSuffix: ' · Reservation #',

            manageDetailAnswerSaved: 'Your answer has been posted.',
            manageDetailHeroLabel: 'Temple Inquiry Details',
            manageDetailReservationPrefix: 'Related Reservation: ',
            manageDetailAnswerHeader: 'Answer',
            manageDetailAnswerPh: 'Write an answer to this inquiry.'
        }
    }
};

function inqLang() {
    return (typeof i18nCurrentLang !== 'undefined') ? i18nCurrentLang : 'ko';
}

function trInq(key) {
    const t = INQUIRY_I18N.ui[inqLang()] || INQUIRY_I18N.ui.ko;
    return t[key] !== undefined ? t[key] : INQUIRY_I18N.ui.ko[key];
}

/** 문의 상태 배지("대기"/"답변완료")는 서버가 enum 이름을 그대로 텍스트로 내려주므로,
    값 자체로 사전 키를 찾아 번역한다 - 새 상태값이 추가돼도 이 함수만 매핑을 늘리면 됨. */
function trInqStatus(rawStatus) {
    if (rawStatus === '대기') return trInq('statusWaiting');
    if (rawStatus === '답변완료') return trInq('statusAnswered');
    return rawStatus;
}

function applyInquiryStaticI18n() {
    document.querySelectorAll('[data-pi18n]').forEach(function (el) {
        const key = el.getAttribute('data-pi18n');
        if (el.hasAttribute('data-pi18n-status')) {
            el.textContent = trInqStatus(el.getAttribute('data-pi18n-status'));
            return;
        }
        const val = trInq(key);
        if (el.hasAttribute('data-pi18n-html')) {
            el.innerHTML = val; // <br> 같은 줄바꿈이 섞인 안내문만 명시적으로 innerHTML로 표시
        } else {
            el.textContent = val;
        }
    });
    document.querySelectorAll('[data-pi18n-placeholder]').forEach(function (el) {
        el.placeholder = trInq(el.getAttribute('data-pi18n-placeholder'));
    });
}

// common.js가 언어 버튼 클릭 시(defaultOnLanguageChange 이후) 등록된 훅을 순서대로 실행한다 -
// programI18n.js와 동일한 패턴. 이 페이지는 onLanguageChange를 따로 정의하지 않아 크롬
// 번역기가 먼저 전체 텍스트를 번역하고, 그 다음 이 훅이 .no-translate 처리된 고정 문구만
// 사전 값으로 덮어써서 두 방식이 부딪히지 않는다.
window.i18nAfterApplyHooks = window.i18nAfterApplyHooks || [];
window.i18nAfterApplyHooks.push(applyInquiryStaticI18n);
