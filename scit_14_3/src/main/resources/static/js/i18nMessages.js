/* ============================================================
   i18nMessages.js - 브라우저 대화상자(alert / confirm)와 서버 오류 메시지 사전 번역
   ------------------------------------------------------------
   alert()/confirm()은 페이지의 글자가 아니라 브라우저가 띄우는 창이라 크롬 번역기나
   common.js의 번역 감시 장치가 건드릴 수 없다. 그래서 문구를 JS에서 직접 골라서 넘겨야 한다.
     alert(i18nMsg('loginRequired'));
     confirm(i18nMsg('confirmDeleteReview'));
   서버(Java)가 한국어로 내려주는 오류 메시지는 i18nSrv()로 감싸서 쓴다. 사전에 정확히
   일치하는 문장이 있으면 번역하고, 없으면 원문(한국어)을 그대로 보여준다.
     alert(i18nSrv(err.message) || i18nMsg('errRequest'));

   현재 언어는 common.js가 언어 버튼을 누를 때 저장하는 쿠키(preferredLang)를 기준으로 한다 -
   홈/로그인처럼 자체 사전을 쓰는 페이지도 같은 쿠키를 쓰므로 어느 페이지에서든 똑같이 동작한다.
   common-includes 조각(fragment)에서 common.js 다음에 로드된다.
============================================================ */

const I18N_MSG = {
    ko: {
        loginRequired: '로그인이 필요합니다.',
        invalidAccess: '잘못된 접근입니다.',
        errRequest: '요청 처리 중 오류가 발생했습니다.',
        // ---- 리뷰 ----
        maxImages: '사진은 최대 {n}장까지 첨부할 수 있습니다.',
        fileTooLarge: '"{name}" 파일이 10MB를 넘어 첨부할 수 없습니다. (무료 Cloudinary 플랜 제한)',
        onlyOwnReservationReview: '본인의 예약에만 리뷰를 작성할 수 있습니다.',
        onlyCompletedReview: '이용이 완료된 예약만 리뷰를 작성할 수 있습니다.',
        alreadyReviewed: '이미 이 예약에 대한 리뷰를 작성했습니다.',
        reviewNotFound: '수정할 리뷰를 찾을 수 없습니다.',
        errLoadReservationInfo: '예약 정보를 불러오는 중 오류가 발생했습니다.',
        pickRating: '평점을 선택해주세요.',
        enterTitle: '제목을 입력해주세요.',
        enterContent: '리뷰 내용을 입력해주세요.',
        errSaveReview: '리뷰 저장 중 오류가 발생했습니다.',
        reviewUpdated: '리뷰가 수정되었습니다.',
        reviewCreated: '리뷰가 등록되었습니다.',
        confirmDeleteReview: '이 리뷰를 삭제하시겠습니까?',
        confirmDeleteMyReview: '작성한 리뷰를 삭제하시겠습니까?',
        reviewDeleted: '리뷰가 삭제되었습니다.',
        errDeleteReview: '리뷰 삭제 중 오류가 발생했습니다.',
        errLoadReviewList: '리뷰 목록을 불러오는 중 오류가 발생했습니다.',
        // ---- 예약 ----
        errLoadReservations: '예약 목록을 불러오는 중 오류가 발생했습니다.',
        errLoadPrograms: '프로그램 목록을 불러오지 못했습니다. 목데이터로 대신 보여줄게요.',
        confirmCancelReservation: '정말 이 예약을 취소하시겠습니까?',
        confirmCancelThisReservation: '이 예약을 취소하시겠습니까?',
        errCancelReservation: '예약 취소 중 오류가 발생했습니다.',
        reservationCanceled: '예약이 취소되었습니다.',
        confirmDeposit: '입금을 확인하셨나요? 예약을 확정 처리합니다.',
        reservationConfirmed: '예약이 확정 처리되었습니다.',
        // ---- 즐겨찾기 / 좋아요 ----
        favLoginRequired: '로그인 후 즐겨찾기가 가능합니다.',
        favLoginToView: '로그인 후 회원의 즐겨찾기 사찰을 볼 수 있습니다.\n로그인 페이지로 이동합니다.',
        confirmUnfavorite: '즐겨찾기를 해제하시겠습니까?',
        confirmUnlike: '좋아요를 취소하시겠습니까?',
        // ---- 사찰 지도 ----
        noSearchResult: '검색 결과가 없습니다.',
        noGeolocation: '이 브라우저에서는 위치 확인 기능을 지원하지 않습니다.',
        noTempleNearby: '반경 {km}km 안에 등록된 사찰이 없습니다.',
        errGeolocation: '현재 위치를 가져올 수 없습니다. 브라우저의 위치 권한을 허용했는지 확인해 주세요.',
        // ---- 계정 ----
        noSignupHistory: '가입이력이 없는 이메일입니다.',
        unregisteredEmail: '등록되지 않은 이메일입니다.',
        signupDone: '회원가입 완료!',
        withdrawAgree: '탈퇴 안내에 동의해주세요.',
        verifyEmailFirst: '이메일 인증을 완료해주세요.',
        // ---- 관리 화면(사찰/관리자) ----
        confirmDelete: '정말 삭제하시겠습니까?',
        confirmCancelRegistration: '등록을 취소(삭제)하시겠습니까?',
        confirmApproveRequest: '이 요청을 승인하고 사찰 계정을 생성하시겠습니까? 계정 정보가 즉시 이메일로 발송됩니다.',
        confirmDeleteImage: '등록된 이미지를 삭제하시겠습니까?',
        confirmDeleteProgram: '이 프로그램을 삭제하시겠습니까?',
        // ---- 홈 ----
        inquiryReceivedTitle: '문의가 접수되었습니다',
        inquiryReceivedText: '검토 후 입력하신 이메일로 안내드리겠습니다.'
    },
    ja: {
        loginRequired: 'ログインが必要です。',
        invalidAccess: '不正なアクセスです。',
        errRequest: 'リクエストの処理中にエラーが発生しました。',
        maxImages: '写真は最大{n}枚まで添付できます。',
        fileTooLarge: '「{name}」は10MBを超えるため添付できません。(無料Cloudinaryプランの制限)',
        onlyOwnReservationReview: 'ご自身の予約にのみレビューを投稿できます。',
        onlyCompletedReview: '利用が完了した予約のみレビューを投稿できます。',
        alreadyReviewed: 'この予約のレビューはすでに投稿済みです。',
        reviewNotFound: '修正するレビューが見つかりません。',
        errLoadReservationInfo: '予約情報の読み込み中にエラーが発生しました。',
        pickRating: '評価を選択してください。',
        enterTitle: 'タイトルを入力してください。',
        enterContent: 'レビュー内容を入力してください。',
        errSaveReview: 'レビューの保存中にエラーが発生しました。',
        reviewUpdated: 'レビューを修正しました。',
        reviewCreated: 'レビューを登録しました。',
        confirmDeleteReview: 'このレビューを削除しますか？',
        confirmDeleteMyReview: '投稿したレビューを削除しますか？',
        reviewDeleted: 'レビューを削除しました。',
        errDeleteReview: 'レビューの削除中にエラーが発生しました。',
        errLoadReviewList: 'レビュー一覧の読み込み中にエラーが発生しました。',
        errLoadReservations: '予約一覧の読み込み中にエラーが発生しました。',
        errLoadPrograms: 'プログラム一覧を読み込めませんでした。代わりにサンプルデータを表示します。',
        confirmCancelReservation: '本当にこの予約をキャンセルしますか？',
        confirmCancelThisReservation: 'この予約をキャンセルしますか？',
        errCancelReservation: '予約のキャンセル中にエラーが発生しました。',
        reservationCanceled: '予約をキャンセルしました。',
        confirmDeposit: '入金を確認しましたか？予約を確定します。',
        reservationConfirmed: '予約を確定しました。',
        favLoginRequired: 'お気に入り機能はログイン後にご利用いただけます。',
        favLoginToView: 'ログイン後、お気に入りの寺院を見ることができます。\nログインページに移動します。',
        confirmUnfavorite: 'お気に入りを解除しますか？',
        confirmUnlike: 'いいねを取り消しますか？',
        noSearchResult: '検索結果がありません。',
        noGeolocation: 'このブラウザでは位置情報機能に対応していません。',
        noTempleNearby: '半径{km}km以内に登録された寺院がありません。',
        errGeolocation: '現在地を取得できません。ブラウザの位置情報の権限を許可しているかご確認ください。',
        noSignupHistory: '登録履歴のないメールアドレスです。',
        unregisteredEmail: '登録されていないメールアドレスです。',
        signupDone: '会員登録が完了しました！',
        withdrawAgree: '退会のご案内に同意してください。',
        verifyEmailFirst: 'メール認証を完了してください。',
        confirmDelete: '本当に削除しますか？',
        confirmCancelRegistration: '登録を取り消し(削除)ますか？',
        confirmApproveRequest: 'このリクエストを承認して寺院アカウントを作成しますか？アカウント情報はすぐにメールで送信されます。',
        confirmDeleteImage: '登録された画像を削除しますか？',
        confirmDeleteProgram: 'このプログラムを削除しますか？',
        inquiryReceivedTitle: 'お問い合わせを受け付けました',
        inquiryReceivedText: '確認後、ご入力のメールアドレスにご連絡いたします。'
    },
    en: {
        loginRequired: 'Login is required.',
        invalidAccess: 'Invalid access.',
        errRequest: 'An error occurred while processing your request.',
        maxImages: 'You can attach up to {n} photos.',
        fileTooLarge: '"{name}" exceeds 10MB and cannot be attached. (Free Cloudinary plan limit)',
        onlyOwnReservationReview: 'You can only review your own reservations.',
        onlyCompletedReview: 'Only completed reservations can be reviewed.',
        alreadyReviewed: 'You have already reviewed this reservation.',
        reviewNotFound: 'The review to edit could not be found.',
        errLoadReservationInfo: 'An error occurred while loading the reservation information.',
        pickRating: 'Please select a rating.',
        enterTitle: 'Please enter a title.',
        enterContent: 'Please enter the review content.',
        errSaveReview: 'An error occurred while saving the review.',
        reviewUpdated: 'The review has been updated.',
        reviewCreated: 'The review has been posted.',
        confirmDeleteReview: 'Are you sure you want to delete this review?',
        confirmDeleteMyReview: 'Are you sure you want to delete your review?',
        reviewDeleted: 'The review has been deleted.',
        errDeleteReview: 'An error occurred while deleting the review.',
        errLoadReviewList: 'An error occurred while loading the reviews.',
        errLoadReservations: 'An error occurred while loading your reservations.',
        errLoadPrograms: 'Could not load the program list. Showing sample data instead.',
        confirmCancelReservation: 'Are you sure you want to cancel this reservation?',
        confirmCancelThisReservation: 'Would you like to cancel this reservation?',
        errCancelReservation: 'An error occurred while canceling the reservation.',
        reservationCanceled: 'The reservation has been canceled.',
        confirmDeposit: 'Have you confirmed the deposit? The reservation will be confirmed.',
        reservationConfirmed: 'The reservation has been confirmed.',
        favLoginRequired: 'Please log in to use favorites.',
        favLoginToView: 'Please log in to see your favorite temples.\nYou will be taken to the login page.',
        confirmUnfavorite: 'Remove this from your favorites?',
        confirmUnlike: 'Cancel your like?',
        noSearchResult: 'No results were found for your search.',
        noGeolocation: 'This browser does not support location services.',
        noTempleNearby: 'There are no registered temples within {km}km.',
        errGeolocation: 'Unable to get your current location. Please check that location permission is allowed in your browser.',
        noSignupHistory: 'No account is registered with this email.',
        unregisteredEmail: 'This email is not registered.',
        signupDone: 'Sign-up complete!',
        withdrawAgree: 'Please agree to the withdrawal notice.',
        verifyEmailFirst: 'Please complete email verification.',
        confirmDelete: 'Are you sure you want to delete this?',
        confirmCancelRegistration: 'Cancel (delete) this registration?',
        confirmApproveRequest: 'Approve this request and create the temple account? The account details will be emailed immediately.',
        confirmDeleteImage: 'Delete the registered image?',
        confirmDeleteProgram: 'Are you sure you want to delete this program?',
        inquiryReceivedTitle: 'Your inquiry has been received',
        inquiryReceivedText: 'We will review it and get back to you at the email address you entered.'
    }
};

/** 서버(Java)가 한국어로 내려주는 오류 메시지 - 정확히 같은 문장만 번역한다(뒤에 값이 붙는 동적 문장은 원문 그대로). */
const I18N_SERVER_MSG = {
    '해당되는 데이터가 존재하지 않습니다.': { ja: '該当するデータが存在しません。', en: 'The requested data does not exist.' },
    '해당 회원을 찾을 수 없습니다.': { ja: '該当する会員が見つかりません。', en: 'The member could not be found.' },
    '해당되는 프로그램이 존재하지 않습니다.': { ja: '該当するプログラムが存在しません。', en: 'The program does not exist.' },
    '해당되는 템플스테이 예약 번호가 존재하지 않습니다.': { ja: '該当するテンプルステイの予約番号が存在しません。', en: 'The Templestay reservation number does not exist.' },
    '해당되는 예약이 존재하지 않습니다.': { ja: '該当する予約が存在しません。', en: 'The reservation does not exist.' },
    '해당 프로그램을 찾을 수 없습니다.': { ja: '該当するプログラムが見つかりません。', en: 'The program could not be found.' },
    '해당된 예약 정보가 없습니다.': { ja: '該当する予約情報がありません。', en: 'No matching reservation information was found.' },
    '해당되는 요청이 존재하지 않습니다.': { ja: '該当するリクエストが存在しません。', en: 'The request does not exist.' },
    '해당되는 문의가 존재하지 않습니다.': { ja: '該当するお問い合わせが存在しません。', en: 'The inquiry does not exist.' },
    '해당되는 리뷰가 존재하지 않습니다.': { ja: '該当するレビューが存在しません。', en: 'The review does not exist.' },
    '평점은 1~5점 사이로 입력해주세요.': { ja: '評価は1～5点の間で入力してください。', en: 'Please enter a rating between 1 and 5.' },
    '제목을 입력해주세요.': { ja: 'タイトルを入力してください。', en: 'Please enter a title.' },
    '리뷰 내용을 입력해주세요.': { ja: 'レビュー内容を入力してください。', en: 'Please enter the review content.' },
    '이미 사용 중인 이메일입니다.': { ja: 'すでに使用されているメールアドレスです。', en: 'This email is already in use.' },
    '이미 사용 중인 법명입니다.': { ja: 'すでに使用されている法名です。', en: 'This dharma name is already in use.' },
    '본인이 작성한 문의만 확인할 수 있습니다.': { ja: 'ご自身が作成したお問い合わせのみ確認できます。', en: 'You can only view inquiries you wrote.' },
    '회원 정보를 찾을 수 없습니다.': { ja: '会員情報が見つかりません。', en: 'Member information could not be found.' },
    '회원 계정으로만 예약할 수 있습니다. 사찰/관리자 계정은 예약할 수 없습니다.': { ja: '会員アカウントでのみ予約できます。寺院・管理者アカウントでは予約できません。', en: 'Only member accounts can make reservations. Temple and admin accounts cannot.' },
    '현재 비밀번호가 일치하지 않습니다.': { ja: '現在のパスワードが一致しません。', en: 'The current password does not match.' },
    '템플스테이가 있는 사찰만 등록 가능합니다.': { ja: 'テンプルステイのある寺院のみ登録できます。', en: 'Only temples that offer Templestay can be registered.' },
    '탈퇴 신청 내역이 없습니다.': { ja: '退会申請の履歴がありません。', en: 'There is no withdrawal request.' },
    '이미 탈퇴가 신청되었습니다.': { ja: 'すでに退会が申請されています。', en: 'Withdrawal has already been requested.' },
    '체크인 24시간 전까지만 취소할 수 있습니다.': { ja: 'チェックインの24時間前までキャンセルできます。', en: 'Cancellation is only possible up to 24 hours before check-in.' },
    '존재하지 않는 행사입니다.': { ja: '存在しない行事です。', en: 'This event does not exist.' },
    '존재하지 않는 사찰음식입니다.': { ja: '存在しない寺院料理です。', en: 'This temple food does not exist.' },
    '존재하지 않는 리뷰입니다.': { ja: '存在しないレビューです。', en: 'This review does not exist.' },
    '존재하지 않는 데이터입니다.': { ja: '存在しないデータです。', en: 'This data does not exist.' },
    '정원이 모두 찼습니다.': { ja: '定員に達しました。', en: 'The program is fully booked.' },
    '입금확인 대상(예약대기)이 아닙니다.': { ja: '入金確認の対象(予約待ち)ではありません。', en: 'This reservation is not awaiting payment confirmation.' },
    '이용이 완료된 예약만 리뷰를 작성할 수 있습니다.': { ja: '利用が完了した予約のみレビューを投稿できます。', en: 'Only completed reservations can be reviewed.' },
    '이용 시작일이 지난 예약은 취소할 수 없습니다.': { ja: '利用開始日を過ぎた予約はキャンセルできません。', en: 'Reservations past their start date cannot be canceled.' },
    '이미 취소된 예약입니다.': { ja: 'すでにキャンセルされた予約です。', en: 'This reservation has already been canceled.' },
    '이미 취소되었거나 이용이 완료된 예약입니다.': { ja: 'すでにキャンセル済み、または利用が完了した予約です。', en: 'This reservation is already canceled or completed.' },
    '이미 접수되어 검토 대기중인 요청입니다.': { ja: 'すでに受け付けられ、審査待ちのリクエストです。', en: 'This request has already been submitted and is awaiting review.' },
    '이미 이 예약에 대한 리뷰를 작성했습니다.': { ja: 'この予約のレビューはすでに投稿済みです。', en: 'You have already reviewed this reservation.' },
    '이미 등록되어 있는 사찰입니다.': { ja: 'すでに登録されている寺院です。', en: 'This temple is already registered.' },
    '이미 결제가 완료된 예약입니다.': { ja: 'すでに決済が完了した予約です。', en: 'Payment for this reservation is already complete.' },
    '이메일 인증을 완료해주세요.': { ja: 'メール認証を完了してください。', en: 'Please complete email verification.' },
    '이 회원에게 연결된 예약/리뷰 등의 데이터가 있어 삭제할 수 없습니다.': { ja: 'この会員に紐づく予約・レビューなどのデータがあるため削除できません。', en: 'Cannot delete: this member has linked data such as reservations or reviews.' },
    '이 프로그램에 연결된 예약이 있어 삭제할 수 없습니다.': { ja: 'このプログラムに紐づく予約があるため削除できません。', en: 'Cannot delete: this program has linked reservations.' },
    '이 사찰에 연결된 프로그램/예약 등의 데이터가 있어 삭제할 수 없습니다.': { ja: 'この寺院に紐づくプログラム・予約などのデータがあるため削除できません。', en: 'Cannot delete: this temple has linked programs or reservations.' },
    '올바르지 않은 이미지입니다.': { ja: '正しくない画像です。', en: 'Invalid image.' },
    '사찰 계정을 찾을 수 없습니다.': { ja: '寺院アカウントが見つかりません。', en: 'The temple account could not be found.' },
    '비밀번호가 일치하지 않습니다.': { ja: 'パスワードが一致しません。', en: 'The passwords do not match.' },
    '본인이 작성한 리뷰만 수정할 수 있습니다.': { ja: 'ご自身が投稿したレビューのみ修正できます。', en: 'You can only edit reviews you wrote.' },
    '본인이 작성한 리뷰만 삭제할 수 있습니다.': { ja: 'ご自身が投稿したレビューのみ削除できます。', en: 'You can only delete reviews you wrote.' },
    '본인의 예약에만 리뷰를 작성할 수 있습니다.': { ja: 'ご自身の予約にのみレビューを投稿できます。', en: 'You can only review your own reservations.' },
    '본인 예약에 대해서만 문의할 수 있습니다.': { ja: 'ご自身の予約についてのみお問い合わせできます。', en: 'You can only make inquiries about your own reservations.' },
    '본인 사찰의 예약만 확정할 수 있습니다.': { ja: 'ご自身の寺院の予約のみ確定できます。', en: 'You can only confirm reservations for your own temple.' },
    '본인 사찰의 예약만 취소할 수 있습니다.': { ja: 'ご自身の寺院の予約のみキャンセルできます。', en: 'You can only cancel reservations for your own temple.' },
    '본인 사찰로 온 문의만 확인할 수 있습니다.': { ja: 'ご自身の寺院宛てのお問い合わせのみ確認できます。', en: 'You can only view inquiries sent to your own temple.' },
    '본인 사찰로 온 문의만 답변할 수 있습니다.': { ja: 'ご自身の寺院宛てのお問い合わせのみ回答できます。', en: 'You can only reply to inquiries sent to your own temple.' },
    '모집 종료일은 시작일보다 빠를 수 없습니다.': { ja: '募集終了日は開始日より前にはできません。', en: 'The recruitment end date cannot be earlier than the start date.' },
    '모집 시작일/종료일을 입력해주세요.': { ja: '募集開始日・終了日を入力してください。', en: 'Please enter the recruitment start and end dates.' },
    '대표 이미지를 등록해주세요.': { ja: '代表画像を登録してください。', en: 'Please upload a main image.' },
    '당일 예약은 불가능합니다. 내일 이후 날짜로 신청해 주세요.': { ja: '当日の予約はできません。明日以降の日付でお申し込みください。', en: 'Same-day reservations are not available. Please choose a date from tomorrow onward.' },
    '결제 승인에 실패했습니다.': { ja: '決済の承認に失敗しました。', en: 'Payment approval failed.' }
};

/** 지금 화면 언어(ko/ja/en). common.js가 언어 버튼을 누를 때 저장하는 쿠키 기준. */
function i18nMsgLang() {
    var lang = (typeof getCookie === 'function') ? getCookie('preferredLang') : null;
    return (lang === 'ja' || lang === 'en') ? lang : 'ko';
}

/** 클라이언트 메시지 - 키로 찾아서 {n}, {name} 같은 자리표시자를 채워 돌려준다. 없는 키는 한국어로 대체. */
function i18nMsg(key, params) {
    var dict = I18N_MSG[i18nMsgLang()] || I18N_MSG.ko;
    var text = dict[key] !== undefined ? dict[key] : (I18N_MSG.ko[key] !== undefined ? I18N_MSG.ko[key] : key);
    if (params) {
        Object.keys(params).forEach(function (k) { text = text.split('{' + k + '}').join(params[k]); });
    }
    return text;
}

/** 서버가 내려준 한국어 오류 메시지 번역 - 사전에 없으면(또는 비어 있으면) 원문 그대로 돌려준다. */
function i18nSrv(text) {
    var lang = i18nMsgLang();
    if (!text || lang === 'ko') return text;
    var entry = I18N_SERVER_MSG[String(text).trim()];
    return (entry && entry[lang]) ? entry[lang] : text;
}
