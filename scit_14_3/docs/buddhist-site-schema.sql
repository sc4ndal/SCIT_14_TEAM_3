-- =====================================================================
-- 부울경 (불교 종합 사이트) DB 스키마
-- 팀명: 佛법을 선도하는 자들(불선자)
-- 대상 DBMS: MySQL 8.0
-- 총 17개 테이블 / BUDDHISM_INFO만 다른 테이블과 연결 없는 독립 테이블
--
-- 이번 정리에서 반영된 결정사항
--   1) TEMPLE_STAY_PROGRAM.program_type은 당일형/체험형/휴식형 3종 유지(변경 없음)
--   2) 진행 일수는 program_type에 종속된 고정 규칙:
--        당일형        -> 반드시 당일(1일) 프로그램
--        체험형/휴식형 -> 반드시 1박2일 프로그램
--      (규칙만 정해졌을 뿐, 이를 저장하는 별도 컬럼은 만들지 않음 - 아래 설명 참고)
--   3) TEMPLE_STAY_RESERVATION의 start_date/end_date는 항상 "둘 다 명시적으로" 저장.
--      end_date를 "start_date + 1일"으로 매번 계산하지 않는다 - 월말(예: 8/31 -> 9/1)
--      경계를 다루는 애플리케이션 로직 실수를 원천 차단하기 위함.
--      (참고: 원래 설계서에도 이미 start_date/end_date가 별도 컬럼으로 있었음 - 그대로 유지)
--   4) TEMPLE_STAY_PROGRAM에 대표 이미지 컬럼(image_url) 추가.
--   5) TEMPLE.api_place_id 제거, 대신 latitude/longitude(위도/경도)로 위치를 받음
--      (지도 API 장소 ID보다 좌표가 더 정확하다는 판단). TEMPLE_STAY_PROGRAM이 트리거로
--      상속받던 컬럼도 api_place_id -> latitude/longitude로 같이 바뀜(support_english와 동일한 방식).
--   6) TEMPLE에 대표 이미지 컬럼(image_url) 추가.
--   7) TEMPLE에 주소 컬럼(address) 추가.
--   8) TEMPLE_REGISTRATION_REQUEST(사찰 등록 요청) 테이블 추가 - 사찰 관계자가 회원가입
--      없이 홈 화면 "문의하기"로 제출하는 요청을 담는 별도 테이블. TEMPLE과 완전히 분리되어
--      있고(승인해도 이 행이 TEMPLE로 "승격"되지 않음), 관리자가 승인하면 별도로 새 TEMPLE
--      행을 생성한다. contact_email은 이 테이블에만 있고 TEMPLE에는 저장되지 않는다.
--   9) 환불 규정은 프로그램마다 다르지 않고 사찰마다 공통이라 TEMPLE_STAY_PROGRAM에서 빼고
--      TEMPLE.refund_policy로 옮김 - 사찰이 프로그램을 여러 개 등록해도 매번 다시 입력할
--      필요가 없도록. 유의사항은 이미 TEMPLE.special_notice(사찰별 개별 유의사항)가 같은
--      역할이라 별도 컬럼을 새로 안 만들고 그대로 재사용함(TEMPLE_STAY_PROGRAM에 있던
--      유의사항 컬럼만 제거). 대신 TEMPLE_STAY_PROGRAM에 프로그램 모집(운영) 기간(open_start_date/
--      open_end_date)을 추가함 - 기존에 빠져있던 값.
--  10) 이 스크립트가 DROP TABLE부터 시작하는 순수 초기화 스크립트라 재실행하면 데이터가
--      전부 사라짐 - 그래서 맨 끝에 초기 테스트 계정(사이트 관리자/일반회원/사찰) INSERT를
--      추가해서 재실행할 때마다 로그인 가능한 계정이 최소한으로 같이 생기도록 함.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 기존 트리거/테이블 삭제 (재실행 대비)
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_program_inherit_before_insert;
DROP TRIGGER IF EXISTS trg_program_inherit_before_update;
DROP TABLE IF EXISTS TEMPLE_REGISTRATION_REQUEST;
DROP TABLE IF EXISTS FAVORITE_FOOD;
DROP TABLE IF EXISTS TEMPLE_FOOD_RECOMMENDATION;
DROP TABLE IF EXISTS FAVORITE_QUOTE;
DROP TABLE IF EXISTS DAILY_QUOTE;
DROP TABLE IF EXISTS BUDDHISM_INFO;
DROP TABLE IF EXISTS FAVORITE_EVENT;
DROP TABLE IF EXISTS TEMPLE_EVENT;
DROP TABLE IF EXISTS FAVORITE_TEMPLE;
DROP TABLE IF EXISTS FAVORITE_REVIEW;
DROP TABLE IF EXISTS TEMPLE_STAY_REVIEW;
DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS RESERVATION_PARTICIPANT;
DROP TABLE IF EXISTS TEMPLE_STAY_RESERVATION;
DROP TABLE IF EXISTS TEMPLE_STAY_PROGRAM;
DROP TABLE IF EXISTS TEMPLE;
DROP TABLE IF EXISTS USER;

SET FOREIGN_KEY_CHECKS = 1;

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
    -- 장소 유형은 중복 가능(바다+도심 등)해서 ENUM 한 컬럼 대신 유형별 boolean으로 둠 (2026-08-31 변경)
    support_sea       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '바다 인근 여부',
    support_mountain  BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '산 인근 여부',
    support_river     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '강 인근 여부',
    support_urban     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '도심 인근 여부',
    support_english   BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '영어 지원 여부',
    is_temple         BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '실제 사찰 건물 여부',
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
    status              ENUM('예약대기','예약확정','취소','이용완료') NOT NULL DEFAULT '예약대기' COMMENT '진행 상태',
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
    payment_method   ENUM('계좌이체','카카오페이') NOT NULL COMMENT '결제 방식',
    amount           INT         NOT NULL COMMENT '결제 금액(원)',
    status           ENUM('대기','완료','취소','환불') NOT NULL DEFAULT '대기' COMMENT '결제 상태',
    depositor_name   VARCHAR(50) NULL COMMENT '입금자명(계좌이체 전용)',
    kakao_tid        VARCHAR(100) NULL COMMENT '카카오페이 거래번호(카카오페이 전용)',
    paid_at          DATETIME    NULL COMMENT '결제 완료 시각',
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제 시도 등록일시',
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payment_reservation (reservation_id),
    CONSTRAINT fk_payment_reservation
        FOREIGN KEY (reservation_id) REFERENCES TEMPLE_STAY_RESERVATION(reservation_id),
    CONSTRAINT chk_payment_method_fields
        CHECK (
            (payment_method = '계좌이체' AND depositor_name IS NOT NULL AND kakao_tid IS NULL)
            OR
            (payment_method = '카카오페이' AND kakao_tid IS NOT NULL AND depositor_name IS NULL)
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
    content         TEXT     NOT NULL COMMENT '리뷰 내용',
    image_urls      JSON     NULL COMMENT '첨부 이미지 목록',
    like_count      INT      NOT NULL DEFAULT 0 COMMENT '추천 수 (캐시값)',
    view_count      INT      NOT NULL DEFAULT 0 COMMENT '조회수',
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
-- 12. BUDDHISM_INFO (불교 정보 게시글) - 독립 테이블, 다른 테이블과 FK 없음
-- =====================================================================
CREATE TABLE BUDDHISM_INFO (
    post_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '게시글 고유 번호',
    category     VARCHAR(30)  NOT NULL COMMENT '로드맵/용어/체크리스트/예절가이드 등',
    title        VARCHAR(150) NOT NULL COMMENT '제목',
    content      TEXT         NOT NULL COMMENT '본문',
    view_count   INT          NOT NULL DEFAULT 0 COMMENT '조회수',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    PRIMARY KEY (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='불교 정보 게시글';

-- =====================================================================
-- 13. DAILY_QUOTE (불교 한마디)
-- =====================================================================
CREATE TABLE DAILY_QUOTE (
    quote_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    content    TEXT         NOT NULL COMMENT '한마디 내용',
    source     VARCHAR(100) NULL COMMENT '출처',
    PRIMARY KEY (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='불교 한마디';

-- =====================================================================
-- 14. FAVORITE_QUOTE (저장한 한마디)
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
-- 15. TEMPLE_FOOD_RECOMMENDATION (사찰음식 추천)
-- =====================================================================
CREATE TABLE TEMPLE_FOOD_RECOMMENDATION (
    recommendation_id  BIGINT      NOT NULL AUTO_INCREMENT COMMENT '고유 번호',
    food_name          VARCHAR(50) NOT NULL COMMENT '음식명',
    description        TEXT        NULL COMMENT '설명',
    recipe             TEXT        NULL COMMENT '레시피',
    image_url          VARCHAR(255) NULL COMMENT '사진',
    PRIMARY KEY (recommendation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사찰음식 추천';

-- =====================================================================
-- 16. FAVORITE_FOOD (관심 사찰음식 즐겨찾기)
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
-- 17. TEMPLE_REGISTRATION_REQUEST (사찰 등록 요청)
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
    -- TEMPLE과 동일한 이유(중복 선택)로 boolean 4개 (2026-08-31 변경)
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
-- 초기 테스트 계정 (이 스크립트를 재실행해서 DB를 초기화할 때마다 같이 생성됨)
-- 비밀번호는 전부 BCryptPasswordEncoder로 해시된 값 - 아래는 원문 비밀번호 기록용 주석.
--   사이트 관리자: admin / admin1234!
--   일반 회원:     testuser1 / Test1234!, testuser2 / Test1234!
--   사찰 계정:     @templetest1 / Test1234!, @templetest2 / Test1234!
-- =====================================================================
INSERT INTO USER (login_id, password, nickname, name, phone, email, role, login_type) VALUES
    ('admin', '$2a$10$TbOlPSKCFHWSjqp963flveOwYKYD6EueH1VxSE2Bm/wdB1NqN5fum', '사이트관리자', 'Admin', NULL, NULL, 'ADMIN', 'LOCAL'),
    ('testuser1', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', '일반회원테스트', '테스트', NULL, 'testuser1@example.com', 'USER', 'LOCAL'),
    ('testuser2', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', '일반회원테스트2', '테스트둘', NULL, 'testuser2@example.com', 'USER', 'LOCAL');

INSERT INTO TEMPLE (name, latitude, longitude, address, region, support_sea, support_mountain, support_river, support_urban, support_english, is_temple, login_id, password, must_change_password) VALUES
    ('테스트사찰', 37.5665000, 126.9780000, '서울시 테스트구 테스트로 1', '서울', FALSE, FALSE, FALSE, TRUE, FALSE, TRUE, '@templetest1', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', FALSE),
    ('테스트사찰2', 35.1595000, 129.0756000, '부산시 테스트구 테스트로 2', '부산', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, '@templetest2', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', FALSE);
