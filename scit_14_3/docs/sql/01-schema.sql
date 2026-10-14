-- =====================================================================
-- 佛선자 (불교 종합 사이트) DB 스키마
-- 프로젝트명: 佛법을 선도하는 자들(불선자)
-- 대상 DBMS: MySQL 8.0
-- 총 18개 테이블
--
-- 테이블 생성 전용 스크립트(DROP 없음): 새 DB에서 한 번만 실행한다.
--   이미 테이블이 있으면 실패하므로, 처음부터 다시 만들려면 scit_14_3 DB를 직접 삭제한 뒤 실행할 것.
-- 더미 데이터(테스트 계정 포함)는 02-dummy-data.sql에 있다.
--   mysql -u root -p --default-character-set=utf8mb4 < 01-schema.sql
--   mysql -u root -p --default-character-set=utf8mb4 < 02-dummy-data.sql
--
-- 설계 규칙
--   1) TEMPLE_STAY_PROGRAM.program_type은 당일형/체험형/휴식형 3종. 진행 일수는 program_type에
--      종속된 고정 규칙(당일형 -> 당일, 체험형/휴식형 -> 1박2일)이다. duration 컬럼은 화면 표시용 문자열일 뿐 일수 계산에 쓰지 않음.
--   2) TEMPLE_STAY_RESERVATION의 start_date/end_date는 항상 둘 다 명시적으로 저장한다.
--      "start_date + 1일"로 매번 계산하지 않음 - 월말(예: 8/31 -> 9/1) 경계 로직 실수를 막기 위함.
--   3) 위치는 지도 API 장소 ID가 아니라 latitude/longitude(좌표)로 저장한다. TEMPLE_STAY_PROGRAM은
--      트리거로 소속 TEMPLE의 support_english/latitude/longitude를 상속받는다.
--   4) TEMPLE_REGISTRATION_REQUEST(사찰 등록 요청)는 TEMPLE과 완전히 분리되어 있다. 승인해도 이 행이
--      TEMPLE로 승격되지 않고, 관리자가 별도로 새 TEMPLE 행을 만든다. contact_email은 이 테이블에만 있다.
--   5) 환불 규정은 사찰마다 공통이라 TEMPLE.refund_policy에, 유의사항은 TEMPLE.special_notice에 둔다
--      (프로그램마다 다시 입력하지 않도록). TEMPLE_STAY_PROGRAM에는 모집(운영) 기간
--      (open_start_date/open_end_date)이 있다.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS scit_14_3 DEFAULT CHARACTER SET utf8mb4;
USE scit_14_3;
SET NAMES utf8mb4;

-- =====================================================================
-- 1. USER (회원)
-- =====================================================================
CREATE TABLE USER (
    login_id     VARCHAR(30)  NOT NULL COMMENT '로그인 아이디 (변경 불가, @ 시작 불가)',
    password     VARCHAR(255) NULL     COMMENT '비밀번호 (카카오 회원은 NULL)',
    nickname     VARCHAR(30)  NOT NULL COMMENT '법명 (마이페이지에서 본인 수정 가능, 관리자도 회원관리에서 수정 가능)',
    name         VARCHAR(150) NOT NULL COMMENT '실명 (여권 영문 이름 형식, 본인 수정 불가 - 변경은 문의를 통해 관리자가 처리)',
    phone        VARCHAR(20)  NULL     COMMENT '연락처',
    email        VARCHAR(100) NULL     COMMENT '이메일 (일반회원은 필수, 사이트 관리자 계정은 불필요해서 NULL 허용)',
    role         ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '일반/사이트 관리자',
    login_type   ENUM('LOCAL','KAKAO') NOT NULL DEFAULT 'LOCAL' COMMENT '가입 경로',
    withdrawal_requested_at DATETIME NULL COMMENT '탈퇴 신청 일시 - NULL이면 정상 회원, 값이 있으면 유예기간(신청일+30일) 중. 이 기간에 로그인하면 철회 가능, 배치가 기한 지난 건을 찾아 탈퇴 확정 처리함',
    withdrawn_at DATETIME NULL COMMENT '로그인 불가 탈퇴 계정 표시 일시 - 전용 계정 withdrawn_user(탈퇴한 회원)에 채워져 있음. 탈퇴 확정은 회원 행을 삭제하고 예약/리뷰 기록은 이 계정으로 넘기는 방식',
    PRIMARY KEY (login_id),
    UNIQUE KEY uq_user_nickname (nickname),
    UNIQUE KEY uq_user_email (email),
    CONSTRAINT chk_user_login_id_no_at
        CHECK (login_id NOT LIKE '@%'),
    CONSTRAINT chk_user_login_id_kakao_prefix
        CHECK (
            (login_type = 'KAKAO' AND login_id LIKE 'kakao\_%')
            OR
            (login_type = 'LOCAL' AND login_id NOT LIKE 'kakao\_%')
        ),
    -- 일반회원(USER)은 이메일 필수, 사이트 관리자(ADMIN)는 예외 (관리자 계정은 회원가입 흐름을 안 거치고
    -- 직접 INSERT로 만들어지므로 이메일 인증을 강제할 방법이 없음)
    CONSTRAINT chk_user_email_required_unless_admin
        CHECK (role = 'ADMIN' OR email IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회원 정보(카카오 로그인 포함)';

-- =====================================================================
-- 2. TEMPLE (사찰)
-- =====================================================================
CREATE TABLE TEMPLE (
    temple_id        BIGINT       NOT NULL AUTO_INCREMENT COMMENT '사찰 고유 번호',
    name              VARCHAR(100) NOT NULL COMMENT '사찰 이름',
    image_url         VARCHAR(255) NULL COMMENT '사찰 대표 이미지 경로',
    -- 지도 API 장소 ID(api_place_id) 대신 좌표를 직접 저장 - 장소 ID보다 정확함.
    -- 위도(latitude) 범위 -90~90, 경도(longitude) 범위 -180~180, 소수점 7자리(약 1cm 오차) 기준.
    latitude          DECIMAL(10,7) NOT NULL COMMENT '위도',
    longitude         DECIMAL(10,7) NOT NULL COMMENT '경도',
    address           VARCHAR(255) NOT NULL COMMENT '주소',
    region            VARCHAR(20)  NOT NULL COMMENT '지역(시/도) 필터',
    -- 장소 유형은 중복 가능(바다+도심 등)해서 ENUM 한 컬럼 대신 유형별 boolean으로 둠
    support_sea       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '바다 인근 여부',
    support_mountain  BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '산 인근 여부',
    support_river     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '강 인근 여부',
    support_urban     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '도심 인근 여부',
    support_english   BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '영어 지원 여부',
    is_temple         BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '실제 사찰 건물 여부',
    -- 리뷰 평균 평점(캐시값). 리뷰 하나도 없으면 NULL(0점 아님) - 리뷰 작성/수정/삭제마다
    -- TempleStayReviewService가 재계산해서 갱신한다(TempleStayReviewService.recalculateTempleRating 참고).
    rating            DECIMAL(2,1) NULL COMMENT '리뷰 평균 평점(소속 리뷰 없으면 NULL)',
    -- rating이 몇 건으로 나온 평균인지 - 평점만 보여주면 리뷰 1개짜리 5점과 50개짜리 4.8점을
    -- 구분 못 해서 신뢰도 판단이 안 된다. rating과 항상 같은 시점에 같이 갱신됨.
    review_count      INT          NOT NULL DEFAULT 0 COMMENT '평균에 반영된 리뷰 건수',
    -- special_notice가 곧 프로그램의 "유의사항" 역할도 겸함 - 이 사찰이 등록하는 모든
    -- 프로그램에 공통 적용됨(프로그램마다 다시 입력 안 함). refund_policy도 같은 이유로
    -- TEMPLE_STAY_PROGRAM이 아니라 여기 있음. 트리거로 프로그램에 복사해두지 않고, 프로그램
    -- 조회 시 TEMPLE을 조인해서 그대로 보여준다(항상 최신값 유지).
    special_notice    TEXT         NULL COMMENT '사찰별 개별 유의사항 (프로그램 상세의 유의사항으로도 그대로 쓰임)',
    refund_policy     TEXT         NULL COMMENT '환불 규정 (사찰 공통, 프로그램 등록 폼에서 안 받고 여기서만 관리)',
    login_id          VARCHAR(30)  NOT NULL COMMENT '사찰 관리자 계정 아이디 (@ 시작 고정)',
    password          VARCHAR(255) NOT NULL COMMENT '사찰 관리자 계정 비밀번호(암호화)',
    must_change_password BOOLEAN  NOT NULL DEFAULT FALSE COMMENT '관리자가 임시 비밀번호를 발급했으면 TRUE - 로그인 시 비밀번호 변경 페이지로 강제 이동',
    PRIMARY KEY (temple_id),
    UNIQUE KEY uq_temple_login_id (login_id),
    CONSTRAINT chk_temple_login_id_at
        CHECK (login_id LIKE '@%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사찰 최소 정보 + 지도 필터 태그 + 관리자 계정';

-- =====================================================================
-- 3. TEMPLE_STAY_PROGRAM (템플스테이 프로그램)
-- =====================================================================
CREATE TABLE TEMPLE_STAY_PROGRAM (
    program_id        BIGINT       NOT NULL AUTO_INCREMENT COMMENT '프로그램 고유 번호',
    temple_id         BIGINT       NOT NULL COMMENT '운영 사찰',
    title             VARCHAR(100) NOT NULL COMMENT '프로그램명',
    -- 당일형 = 반드시 당일(1일) 프로그램 / 체험형·휴식형 = 반드시 1박2일 프로그램 (고정 규칙)
    program_type      ENUM('당일형','체험형','휴식형') NOT NULL COMMENT '유형 (당일형=1일, 체험형/휴식형=1박2일 고정)',
    image_url         VARCHAR(255) NOT NULL COMMENT '프로그램 대표 이미지 경로 (필수)',
    description       TEXT         NULL COMMENT '소개',
    schedule          TEXT         NULL COMMENT '일정표',
    required_items    TEXT         NULL COMMENT '준비물',
    -- 환불 규정/유의사항은 사찰 공통이라 여기 없음 - TEMPLE.refund_policy/special_notice 참고.
    price             INT          NOT NULL COMMENT '참가 비용(원, 1인 기준)',
    duration          VARCHAR(20)  NOT NULL COMMENT '진행 기간 표기(예: 당일, 1박 2일) - 실제 체류 기간',
    -- duration(체류 기간)과 다른 개념: 이 프로그램을 언제부터 언제까지 모집/운영하는지의 기간.
    open_start_date   DATE         NOT NULL COMMENT '모집(운영) 시작일',
    open_end_date     DATE         NOT NULL COMMENT '모집(운영) 종료일',
    max_participant   INT          NOT NULL DEFAULT 20 COMMENT '최대 인원 (전 프로그램 공통 20명 고정)',
    -- 아래 컬럼들은 관리자가 직접 입력해도 저장 시점에 트리거가 소속 TEMPLE의 값으로 덮어씀
    -- (trg_program_inherit_before_insert / _before_update 참고).
    -- 한국어는 항상 기본 지원이라 별도 컬럼 없음. 외국어는 영어만 지원 대상이라
    -- support_japanese는 만들지 않음.
    support_english   BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '영어 진행 여부. 트리거로 소속 TEMPLE.support_english 상속',
    latitude          DECIMAL(10,7) NOT NULL COMMENT '위도. 트리거로 소속 TEMPLE.latitude 상속',
    longitude         DECIMAL(10,7) NOT NULL COMMENT '경도. 트리거로 소속 TEMPLE.longitude 상속',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (program_id),
    CONSTRAINT fk_program_temple
        FOREIGN KEY (temple_id) REFERENCES TEMPLE(temple_id),
    CONSTRAINT chk_program_max_participant
        CHECK (max_participant = 20),
    CONSTRAINT chk_program_open_dates
        CHECK (open_end_date >= open_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='템플스테이 프로그램 (한국어는 기본 지원, 외국어는 영어만 지원)';

-- ---------------------------------------------------------------------
-- TEMPLE_STAY_PROGRAM.support_english / latitude / longitude를 소속 사찰(TEMPLE)의
-- 현재 값과 항상 동일하게 유지하는 트리거. 프로그램 등록/수정 시 관리자가 이 값들을
-- 직접 입력하더라도, 저장되는 순간 사찰의 현재 값으로 덮어써진다.
-- (주의: TEMPLE 쪽 값이 "나중에" 바뀌어도 이미 등록된 프로그램들에는 자동으로
--  소급 반영되지 않는다 - 그 경우까지 필요하면 TEMPLE 쪽에 별도 트리거 추가 필요)
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_program_inherit_before_insert
BEFORE INSERT ON TEMPLE_STAY_PROGRAM
FOR EACH ROW
BEGIN
    DECLARE v_support_english BOOLEAN;
    DECLARE v_latitude DECIMAL(10,7);
    DECLARE v_longitude DECIMAL(10,7);
    SELECT support_english, latitude, longitude INTO v_support_english, v_latitude, v_longitude
      FROM TEMPLE WHERE temple_id = NEW.temple_id;
    SET NEW.support_english = v_support_english;
    SET NEW.latitude = v_latitude;
    SET NEW.longitude = v_longitude;
END$$

CREATE TRIGGER trg_program_inherit_before_update
BEFORE UPDATE ON TEMPLE_STAY_PROGRAM
FOR EACH ROW
BEGIN
    DECLARE v_support_english BOOLEAN;
    DECLARE v_latitude DECIMAL(10,7);
    DECLARE v_longitude DECIMAL(10,7);
    SELECT support_english, latitude, longitude INTO v_support_english, v_latitude, v_longitude
      FROM TEMPLE WHERE temple_id = NEW.temple_id;
    SET NEW.support_english = v_support_english;
    SET NEW.latitude = v_latitude;
    SET NEW.longitude = v_longitude;
END$$

DELIMITER ;

-- =====================================================================
-- 4. TEMPLE_STAY_RESERVATION (예약)
-- =====================================================================
CREATE TABLE TEMPLE_STAY_RESERVATION (
    reservation_id      BIGINT   NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id            VARCHAR(30) NOT NULL COMMENT '신청 대표 회원',
    program_id          BIGINT   NOT NULL COMMENT '대상 프로그램',
    -- start_date/end_date는 신청 시점에 애플리케이션이 둘 다 계산해서 그대로 저장한다.
    -- (당일형 -> end_date = start_date / 체험형,휴식형 -> end_date = start_date + 1일)
    -- 월말 경계(예: 8/31 시작 -> 9/1 종료) 문제를 피하기 위해 "저장 시점에 1회 계산 후 고정",
    -- 조회할 때마다 start_date에 +1을 다시 계산하지 않는다.
    start_date          DATE     NOT NULL COMMENT '이용 시작일',
    end_date            DATE     NOT NULL COMMENT '이용 종료일 (계산 결과를 명시적으로 저장)',
    participant_count   INT      NOT NULL COMMENT '신청 인원',
    note                TEXT     NULL COMMENT '전달사항(비고)',
    -- 예약 시점에 사용자가 보고 있던 화면 언어(ko/ja/en). 사찰 관리자의 입금확인/취소, 자동취소
    -- 배치처럼 예약자 본인의 요청이 아닌 시점에도 안내 메일을 예약자 언어로 보내기 위해 저장한다.
    lang                VARCHAR(2) NOT NULL DEFAULT 'ko' COMMENT '예약 시점 화면 언어(ko/ja/en) - 안내 메일 언어',
    -- 프로그램명/사찰명은 DB에 번역본이 없고(프로그램명은 번역기 결과, 사찰명은 JS 사전 결과) 서버가
    -- 나중에(입금확인/자동취소 등) 다시 만들어낼 수 없다. 그래서 lang과 마찬가지로 신청 시점에 화면에
    -- 보이던 번역 결과를 그대로 캡처해서 저장해두고, 안내 메일(대기/확정/취소)은 전부 이 값을 쓴다.
    program_title_snapshot VARCHAR(150) NOT NULL COMMENT '신청 시점 화면 언어로 번역된 프로그램명(안내 메일용)',
    temple_name_snapshot   VARCHAR(150) NOT NULL COMMENT '신청 시점 화면 언어로 번역된 사찰명(안내 메일용)',
    -- 카드 결제(즉시 전자결제)는 선착순으로 바로 '예약확정'. 계좌이체(무통장입금)는
    -- 실제 입금 여부를 시스템이 확인할 수 없어서 일단 '예약대기'로 걸어두고, 사찰이
    -- 입금을 확인하면 '예약확정'으로 바꾼다(3일 안에 안 바꾸면 배치가 자동 '취소').
    status              ENUM('예약대기','예약확정','취소','이용완료') NOT NULL DEFAULT '예약확정' COMMENT '진행 상태',
    canceled_at         DATETIME NULL COMMENT '취소일시',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일시',
    PRIMARY KEY (reservation_id),
    CONSTRAINT fk_reservation_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id),
    CONSTRAINT fk_reservation_program
        FOREIGN KEY (program_id) REFERENCES TEMPLE_STAY_PROGRAM(program_id),
    CONSTRAINT chk_reservation_dates
        CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='템플스테이 예약';

-- =====================================================================
-- 5. RESERVATION_PARTICIPANT (예약 참가자)
-- =====================================================================
CREATE TABLE RESERVATION_PARTICIPANT (
    participant_id  BIGINT      NOT NULL AUTO_INCREMENT COMMENT '참가자 고유 번호',
    reservation_id  BIGINT      NOT NULL COMMENT '소속 예약',
    name            VARCHAR(50) NOT NULL COMMENT '이름(여권 영문 이름 형식)',
    gender          ENUM('남성','여성') NOT NULL COMMENT '성별',
    email           VARCHAR(100) NOT NULL COMMENT '참가자 이메일',
    phone           VARCHAR(20) NULL COMMENT '연락처(대표자만 입력, 나머지는 NULL)',
    PRIMARY KEY (participant_id),
    CONSTRAINT fk_participant_reservation
        FOREIGN KEY (reservation_id) REFERENCES TEMPLE_STAY_RESERVATION(reservation_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='예약 참가자별 인적사항';

-- =====================================================================
-- 6. PAYMENT (예약 결제)
-- =====================================================================
CREATE TABLE PAYMENT (
    payment_id       BIGINT      NOT NULL AUTO_INCREMENT COMMENT '결제 고유 번호',
    reservation_id   BIGINT      NOT NULL COMMENT '결제 대상 예약(1예약=1결제)',
    payment_method   ENUM('계좌이체','카드') NOT NULL COMMENT '결제 방식(카드는 토스페이먼츠 경유 - 그 안에서 실제 카드/간편결제 등 다양한 수단으로 결제됨)',
    amount           INT         NOT NULL COMMENT '결제 금액(원)',
    status           ENUM('대기','완료','취소','환불') NOT NULL DEFAULT '대기' COMMENT '결제 상태',
    depositor_name   VARCHAR(50) NULL COMMENT '입금자명(계좌이체 전용)',
    toss_payment_key VARCHAR(200) NULL COMMENT '토스페이먼츠 결제키(카드 전용)',
    payment_detail   VARCHAR(50) NULL COMMENT '토스 confirm 응답의 실제 결제수단(카드/간편결제 제공자명 등, 카드 전용, 표시용)',
    paid_at          DATETIME    NULL COMMENT '결제 완료 시각',
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제 시도 등록일시',
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payment_reservation (reservation_id),
    CONSTRAINT fk_payment_reservation
        FOREIGN KEY (reservation_id) REFERENCES TEMPLE_STAY_RESERVATION(reservation_id),
    -- 카드결제는 결제창을 클라이언트 SDK(토스)가 직접 열어서, 결제 준비(ready) 시점엔
    -- toss_payment_key를 아직 모른다(결제 완료 후 콜백에서야 받음) - 그래서 이 제약은
    -- status가 '완료'로 확정된 행에만 걸고, 대기(ready) 중인 행은 필드가 비어있어도 통과시킨다.
    CONSTRAINT chk_payment_method_fields
        CHECK (
            status != '완료'
            OR
            (
                (payment_method = '계좌이체' AND depositor_name IS NOT NULL AND toss_payment_key IS NULL)
                OR
                (payment_method = '카드' AND toss_payment_key IS NOT NULL AND depositor_name IS NULL)
            )
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='예약 결제';

-- =====================================================================
-- 7. TEMPLE_STAY_REVIEW (리뷰)
-- =====================================================================
CREATE TABLE TEMPLE_STAY_REVIEW (
    review_id       BIGINT   NOT NULL AUTO_INCREMENT COMMENT '리뷰 고유 번호',
    reservation_id  BIGINT   NOT NULL COMMENT '대상 예약(1예약=1리뷰)',
    login_id        VARCHAR(30) NOT NULL COMMENT '작성 회원',
    rating          TINYINT  NOT NULL COMMENT '평점(1~5)',
    title           VARCHAR(100) NULL COMMENT '리뷰 제목 (선택 입력)',
    content         TEXT     NOT NULL COMMENT '리뷰 내용',
    image_urls      JSON     NULL COMMENT '첨부 이미지 목록',
    like_count      INT      NOT NULL DEFAULT 0 COMMENT '추천 수 (캐시값)',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (review_id),
    UNIQUE KEY uq_review_reservation (reservation_id),
    CONSTRAINT fk_review_reservation
        FOREIGN KEY (reservation_id) REFERENCES TEMPLE_STAY_RESERVATION(reservation_id),
    CONSTRAINT fk_review_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id),
    CONSTRAINT chk_review_rating
        CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='템플스테이 리뷰';

-- =====================================================================
-- 8. FAVORITE_REVIEW (좋아요한 리뷰)
-- =====================================================================
CREATE TABLE FAVORITE_REVIEW (
    favorite_review_id  BIGINT   NOT NULL AUTO_INCREMENT COMMENT '좋아요 고유 번호',
    login_id            VARCHAR(30) NOT NULL COMMENT '좋아요한 회원',
    review_id           BIGINT   NOT NULL COMMENT '대상 리뷰',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '좋아요 등록일시',
    PRIMARY KEY (favorite_review_id),
    UNIQUE KEY uq_favorite_review (login_id, review_id),
    CONSTRAINT fk_favreview_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_favreview_review
        FOREIGN KEY (review_id) REFERENCES TEMPLE_STAY_REVIEW(review_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='좋아요한 리뷰 (중복 좋아요 방지 겸용)';

-- =====================================================================
-- 9. FAVORITE_TEMPLE (관심 사찰)
-- =====================================================================
CREATE TABLE FAVORITE_TEMPLE (
    favorite_id   BIGINT   NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id      VARCHAR(30) NOT NULL COMMENT '회원',
    temple_id     BIGINT   NOT NULL COMMENT '사찰',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uq_favorite_temple (login_id, temple_id),
    CONSTRAINT fk_favtemple_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_favtemple_temple
        FOREIGN KEY (temple_id) REFERENCES TEMPLE(temple_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='관심 사찰';

-- =====================================================================
-- 10. TEMPLE_EVENT (사찰 행사)
-- =====================================================================
CREATE TABLE TEMPLE_EVENT (
    event_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '행사 고유 번호',
    temple_id     BIGINT       NOT NULL COMMENT '주최 사찰',
    title         VARCHAR(150) NOT NULL COMMENT '행사명',
    description   TEXT         NULL COMMENT '행사 소개',
    start_date    DATE         NOT NULL COMMENT '행사 시작일',
    end_date      DATE         NOT NULL COMMENT '행사 종료일',
    -- 행사 공식 페이지/기사 등 자세히 보기 링크 (없으면 NULL)
    link_url      VARCHAR(255) NULL COMMENT '행사 상세/공식 페이지 링크',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (event_id),
    CONSTRAINT fk_event_temple
        FOREIGN KEY (temple_id) REFERENCES TEMPLE(temple_id),
    CONSTRAINT chk_event_dates
        CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사찰 행사';

-- =====================================================================
-- 11. FAVORITE_EVENT (관심 행사)
-- =====================================================================
CREATE TABLE FAVORITE_EVENT (
    favorite_event_id  BIGINT   NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id           VARCHAR(30) NOT NULL COMMENT '회원',
    event_id           BIGINT   NOT NULL COMMENT '행사',
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (favorite_event_id),
    UNIQUE KEY uq_favorite_event (login_id, event_id),
    CONSTRAINT fk_favevent_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_favevent_event
        FOREIGN KEY (event_id) REFERENCES TEMPLE_EVENT(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='관심 행사';

-- =====================================================================
-- 12. DAILY_QUOTE (불교 한마디)
-- =====================================================================
CREATE TABLE DAILY_QUOTE (
    quote_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    content    TEXT         NOT NULL COMMENT '한마디 내용',
    source     VARCHAR(100) NULL COMMENT '출처',
    PRIMARY KEY (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='불교 한마디';

-- =====================================================================
-- 13. FAVORITE_QUOTE (저장한 한마디)
-- =====================================================================
CREATE TABLE FAVORITE_QUOTE (
    favorite_quote_id  BIGINT   NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id           VARCHAR(30) NOT NULL COMMENT '회원',
    quote_id           BIGINT   NOT NULL COMMENT '한마디',
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '저장일시',
    PRIMARY KEY (favorite_quote_id),
    UNIQUE KEY uq_favorite_quote (login_id, quote_id),
    CONSTRAINT fk_favquote_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_favquote_quote
        FOREIGN KEY (quote_id) REFERENCES DAILY_QUOTE(quote_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='저장한 불교 한마디';

-- =====================================================================
-- 14. TEMPLE_FOOD_RECOMMENDATION (사찰음식 추천)
-- =====================================================================
CREATE TABLE TEMPLE_FOOD_RECOMMENDATION (
    recommendation_id  BIGINT      NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    food_name          VARCHAR(50) NOT NULL COMMENT '음식명',
    description        TEXT        NULL COMMENT '설명',
    recipe             TEXT        NULL COMMENT '레시피',
    -- 레시피 참고 링크(만개의레시피 등) 전용 컬럼
    recipe_url         VARCHAR(255) NULL COMMENT '레시피 참고 링크',
    image_url          VARCHAR(255) NULL COMMENT '사진',
    PRIMARY KEY (recommendation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사찰음식 추천';

-- =====================================================================
-- 15. FAVORITE_FOOD (관심 사찰음식 즐겨찾기)
-- =====================================================================
CREATE TABLE FAVORITE_FOOD (
    favorite_food_id   BIGINT   NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id           VARCHAR(30) NOT NULL COMMENT '회원',
    recommendation_id  BIGINT   NOT NULL COMMENT '음식',
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (favorite_food_id),
    UNIQUE KEY uq_favorite_food (login_id, recommendation_id),
    CONSTRAINT fk_favfood_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_favfood_recommendation
        FOREIGN KEY (recommendation_id) REFERENCES TEMPLE_FOOD_RECOMMENDATION(recommendation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='관심 사찰음식 즐겨찾기';

-- =====================================================================
-- 16. TEMPLE_REGISTRATION_REQUEST (사찰 등록 요청)
--     - 사찰 관계자가 회원가입 없이 남기는 요청. TEMPLE과 분리되어 있고, 관리자가
--       승인하면 이 행이 아니라 완전히 새로운 TEMPLE 행이 생성된다(승격 아님).
--     - login_id/password/is_temple은 관리자 승인 시 시스템이 생성하는 값이라
--       여기 없다.
-- =====================================================================
CREATE TABLE TEMPLE_REGISTRATION_REQUEST (
    request_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '요청 고유 번호',
    name                VARCHAR(100) NOT NULL COMMENT '사찰 이름',
    image_url           VARCHAR(255) NULL COMMENT '사찰 대표 이미지 경로',
    latitude            DECIMAL(10,7) NOT NULL COMMENT '위도',
    longitude           DECIMAL(10,7) NOT NULL COMMENT '경도',
    address             VARCHAR(255) NOT NULL COMMENT '주소',
    region              VARCHAR(20)  NOT NULL COMMENT '지역(시/도) 필터',
    -- TEMPLE과 동일한 이유(중복 선택)로 boolean 4개
    support_sea         BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '바다 인근 여부',
    support_mountain    BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '산 인근 여부',
    support_river       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '강 인근 여부',
    support_urban       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '도심 인근 여부',
    support_english     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '영어 지원 여부',
    special_notice      TEXT         NULL COMMENT '사찰별 개별 유의사항',
    refund_policy       TEXT         NULL COMMENT '환불 규정',
    contact_email       VARCHAR(100) NOT NULL COMMENT '요청자 연락 이메일 - 승인 시 계정정보 발송 대상 (TEMPLE엔 저장 안 됨)',
    status              ENUM('대기','승인') NOT NULL DEFAULT '대기' COMMENT '처리 상태',
    approved_temple_id  BIGINT       NULL COMMENT '승인 후 생성된 TEMPLE 행 추적용(승격이 아니라 별도 생성)',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청 등록일시',
    PRIMARY KEY (request_id),
    CONSTRAINT fk_templereq_approved_temple
        FOREIGN KEY (approved_temple_id) REFERENCES TEMPLE(temple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사찰 관계자가 제출한 사찰 등록 요청(관리자 승인 대기열)';

-- =====================================================================
-- 17. INQUIRY (1:1 문의)
-- =====================================================================
CREATE TABLE INQUIRY (
    inquiry_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id     VARCHAR(30)  NOT NULL COMMENT '작성 회원',
    title        VARCHAR(100) NOT NULL COMMENT '제목',
    content      TEXT         NOT NULL COMMENT '문의 내용',
    answer       TEXT         NULL COMMENT '관리자 답변',
    status       ENUM('대기','답변완료') NOT NULL DEFAULT '대기' COMMENT '처리 상태',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    answered_at  DATETIME     NULL COMMENT '답변일시',
    PRIMARY KEY (inquiry_id),
    CONSTRAINT fk_inquiry_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='일반회원이 사이트 관리자에게 남기는 1:1 문의';

-- =====================================================================
-- 18. TEMPLE_INQUIRY (사찰 1:1 문의)
-- =====================================================================
-- INQUIRY(회원 -> 사이트 관리자)와 별개 테이블 - 회원이 사찰에게 직접 문의하는 채널.
-- 24시간 이내라 예약을 직접 취소할 수 없을 때, 사찰에 취소를 요청하는 용도로 만듦
-- (그래서 reservation_id를 남겨서 어떤 예약 얘기인지 사찰이 바로 알 수 있게 함).
CREATE TABLE TEMPLE_INQUIRY (
    inquiry_id     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    login_id       VARCHAR(30)  NOT NULL COMMENT '작성 회원',
    temple_id      BIGINT       NOT NULL COMMENT '문의 대상 사찰',
    reservation_id BIGINT       NULL COMMENT '관련 예약(있으면) - 예약 취소 요청 등',
    title          VARCHAR(100) NOT NULL COMMENT '제목',
    content        TEXT         NOT NULL COMMENT '문의 내용',
    answer         TEXT         NULL COMMENT '사찰 답변',
    status         ENUM('대기','답변완료') NOT NULL DEFAULT '대기' COMMENT '처리 상태',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    answered_at    DATETIME     NULL COMMENT '답변일시',
    PRIMARY KEY (inquiry_id),
    CONSTRAINT fk_temple_inquiry_user
        FOREIGN KEY (login_id) REFERENCES USER(login_id) ON DELETE CASCADE,
    CONSTRAINT fk_temple_inquiry_temple
        FOREIGN KEY (temple_id) REFERENCES TEMPLE(temple_id),
    CONSTRAINT fk_temple_inquiry_reservation
        FOREIGN KEY (reservation_id) REFERENCES TEMPLE_STAY_RESERVATION(reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회원이 사찰에게 남기는 1:1 문의(예약 취소 요청 등)';
