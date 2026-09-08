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
use scit_14_3;
set autocommit = 1;
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
    -- 사찰 관리자 승인 절차 없이 선착순으로 바로 확정하는 정책이라 '예약대기' 상태는 없음.
    status              ENUM('예약확정','취소','이용완료') NOT NULL DEFAULT '예약확정' COMMENT '진행 상태',
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
-- 템플스테이 프로그램 더미값도 테스트사찰/테스트사찰2 앞으로 하나씩 같이 생성됨.
-- =====================================================================
INSERT INTO USER (login_id, password, nickname, name, phone, email, role, login_type) VALUES
    ('admin', '$2a$10$TbOlPSKCFHWSjqp963flveOwYKYD6EueH1VxSE2Bm/wdB1NqN5fum', '사이트관리자', 'Admin', NULL, NULL, 'ADMIN', 'LOCAL'),
    ('testuser1', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', '일반회원테스트', '테스트', NULL, 'testuser1@example.com', 'USER', 'LOCAL'),
    ('testuser2', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', '일반회원테스트2', '테스트둘', NULL, 'testuser2@example.com', 'USER', 'LOCAL');

INSERT INTO TEMPLE (name, latitude, longitude, address, region, support_sea, support_mountain, support_river, support_urban, support_english, is_temple, login_id, password, must_change_password) VALUES
    ('테스트사찰', 37.5665000, 126.9780000, '서울시 테스트구 테스트로 1', '서울', FALSE, FALSE, FALSE, TRUE, FALSE, TRUE, '@templetest1', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', FALSE),
    ('테스트사찰2', 35.1595000, 129.0756000, '부산시 테스트구 테스트로 2', '부산', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, '@templetest2', '$2a$10$RlY25ofavPN8ENU81L7oCuOL8F8C7j5bmadGfY54aCAQO6pzZ3SEu', FALSE);

-- 전국 사찰 171곳 일괄 등록 (2026-09-07, 장소 유형 2차 검증 반영). templestay.com(한국불교문화사업단) 공식
-- 사찰 목록의 주소 기준으로 좌표를 지도에서 찾았고, support_english는 templestay.com 영문 사이트에 실제로
-- 올라와있는 사찰만 TRUE로 표시함(추측 아님).
--
-- 장소 유형(바다/산/강/도심)은 1차 등록 후 "범어사에 바다 태그가 잘못 들어감" 등 오류가 발견되어 재검증함.
-- 자동화 시도(지도 API 순회, LLM 5회 다수결)는 신뢰도 문제로 폐기하고, 아래 14곳만
-- 실제 검색/직접 지식으로 확인해서 고침 - 나머지는 확신 없는 자동 판정을 다시 자동 판정으로 덮어쓰느니
-- 원래 값(1차 등록 시점 판정) 그대로 둠. 정확도가 중요하면 아래 목록부터 우선 재검토할 것.
-- 수정 반영된 곳: 개암사, 건봉사, 골굴사, 금룡사, 내소사, 대흥사, 동화사, 범어사, 법륜사, 보경사, 봉은사, 수원사, 약천사, 조계사
--
-- 로그인 계정: 전부 임시 비밀번호 'Temple1234!' 공통 발급, must_change_password=TRUE라 로그인하면
-- 바로 비밀번호부터 바꿔야 함(기존 사찰 등록 승인 흐름과 동일한 패턴).
--
-- 주소/좌표를 못 찾아서 이번엔 등록 안 하고 뺀 사찰: 청춘사
-- (템플스테이 공식 사이트 자체에 주소가 "테스트 페이지 입니다"로 잘못 들어가있는 등 원본 데이터 문제 -
--  실제 위치를 찾으면 그때 별도로 추가할 것)
--
-- 좌표는 있지만 지도에서 정확히 이 이름의 장소로 확인은 안 된 곳(주소 좌표는 신뢰 가능, 이름 매칭만 불확실) - 실사용 전 확인 권장: 미타사, 이제사, 화암사
INSERT INTO TEMPLE (name, latitude, longitude, address, region, support_sea, support_mountain, support_river, support_urban, support_english, is_temple, login_id, password, must_change_password) VALUES
    ('감산사', 35.7666236, 129.3366913, '경상북도 경주시 외동읍 앞등길 117-20', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple001', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('갑사', 36.3653593, 127.1873813, '충청남도 공주시 계룡면 갑사로 567-3', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple002', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('개암사', 35.6623373, 126.6493239, '전라북도 부안군 상서면 개암로 248', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple003', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('건봉사', 38.4021773, 128.3799855, '강원특별자치도 고성군 거진읍 건봉사로 723', '강원', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple004', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('경국사', 37.6146726, 127.0049176, '서울특별시 성북구 보국문로 113-10', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple005', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('고운사', 36.4584468, 128.7503637, '경상북도 의성군 단촌면 고운사길 415', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple006', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('골굴사', 35.8030449, 129.4055403, '경상북도 경주시 문무대왕면 기림로 101-5', '경북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple007', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('관문사', 37.4735911, 127.0220191, '서울특별시 서초구 바우뫼로7길 111', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple008', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('관음사(제주)', 33.4237461, 126.5579748, '제주특별자치도 제주시 산록북로 660', '제주', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple009', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('광제사', 36.5080718, 127.2917017, '세종특별자치시 모롱지로 94', '세종', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple010', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('구룡사', 37.3998195, 128.0499856, '강원특별자치도 원주시 소초면 구룡사로 500', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple011', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('구인사', 37.0318394, 128.4800605, '충청북도 단양군 영춘면 구인사길 73', '충북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple012', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('국제선센터', 37.5207743, 126.8700850, '서울특별시 양천구 목동동로 167', '서울', FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, '@temple013', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('귀정사', 35.5122843, 127.4556504, '전북특별자치도 남원시 산동면 대상2길 246', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple014', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금강정사', 37.4417982, 126.8728166, '경기도 광명시 설월로 58', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple015', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금당사', 35.7577274, 127.3976135, '전라북도 진안군 마령면 마이산남로 217', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple016', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금룡사', 33.5538998, 126.7537599, '제주특별자치도 제주시 구좌읍 김녕로 148-11', '제주', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, '@temple017', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금산사', 35.7232472, 127.0537163, '전라북도 김제시 금산면 모악15길 1', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple018', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금선사', 37.6205778, 126.9533792, '서울특별시 종로구 비봉길 137', '서울', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple019', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('금수암', 35.4084118, 127.8172542, '경상남도 산청군 금서면 새터길 57-98', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple020', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('기림사', 35.8379542, 129.4034545, '경상북도 경주시 양북면 기림로 437-17', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple021', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('길상사', 37.5988548, 126.9943511, '서울특별시 성북구 선잠로5길 68', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple022', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('낙산사', 38.1246156, 128.6280451, '강원특별자치도 양양군 강현면 낙산사로 100', '강원', TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple023', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('내소사', 35.6174534, 126.5873332, '전라북도 부안군 진서면 내소사로 243 내소사 템플사무국', '전북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple024', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('내원정사', 35.1264371, 129.0122784, '부산광역시 서구 엄광산로40번길 80', '부산', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple025', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('능가사', 34.6390610, 127.4143389, '전라남도 고흥군 점암면 팔봉길 21', '전남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple026', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대광사(성남)', 37.3463572, 127.1273243, '경기도 성남시 분당구 구미로185번길 30', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple027', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대광사(창원)', 35.1284577, 128.7398399, '경상남도 창원시 진해구 진해대로 303', '경남', TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple028', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대승사', 36.7498958, 128.2719631, '경상북도 문경시 산북면 대승사길 283', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple029', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대원사(가평)', 37.8943842, 127.5025767, '경기도 가평군 북면 백둔로 21-162', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple030', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대원사(보성)', 34.9612552, 127.1330300, '전라남도 보성군 문덕면 죽산길 506-8', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple031', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대원사(산청)', 35.3554923, 127.8069112, '경상남도 산청군 삼장면 대원사길 455', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple032', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('대흥사', 34.4760080, 126.6163013, '전라남도 해남군 삼산면 대흥사길 400', '전남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple033', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('도갑사', 34.7527935, 126.6628574, '전라남도 영암군 군서면 도갑사로 306', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple034', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('도리사', 36.2558861, 128.3982031, '경상북도 구미시 해평면 도리사로 526', '경북', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple035', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('도림사(곡성)', 35.2671893, 127.2575367, '전라남도 곡성군 도림로 175', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple036', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('도림사(대구)', 35.9495584, 128.7293807, '대구광역시 동구 인산로 242', '대구', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple037', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('도선사', 37.6554935, 126.9897725, '서울시 강북구 도선사길278', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple038', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('동화사', 35.9929105, 128.7039968, '대구광역시 동구 동화사1길 1 동화사 템플스테이', '대구', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple039', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('마곡사', 36.5588530, 127.0121200, '충청남도 공주시 사곡면 마곡사로 966', '충남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple040', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('망경산사', 37.1577980, 128.6005180, '강원특별자치도 영월군 망경대산길 135-6', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple041', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('명주사', 37.2570289, 128.1287700, '강원특별자치도 원주시 신림면 물안길 62', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple042', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('묘각사', 37.5754233, 127.0187431, '서울특별시 종로구 종로63가길 31', '서울', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple043', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('묘적사', 37.6235389, 127.2611084, '경기도 남양주시 와부읍 수레로661번길 174', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple044', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('무각사', 35.1536315, 126.8564309, '광주광역시 서구 운천로 230', '광주', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple045', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('무량사', 36.3170158, 126.6930522, '충청남도 부여군 외산면 무량로 203', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple046', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('무위사', 34.7384651, 126.6869062, '전라남도 강진군 성전면 무위사로 308(무위사)', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple047', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('문수암', 35.2882051, 127.8537353, '경상남도 산청군 시천면 마근담길 173-17', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple048', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('미륵대흥사', 36.8564422, 128.3475113, '충청북도 단양군 대강면 황정산로423', '충북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple049', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('미륵사', 34.9382950, 126.7813645, '전라남도 나주시 봉황면 세남로 408-64', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple050', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('미타사', 36.9541388, 127.7315688, '충북 음성군 소이면 소이로 61번길 164', '충북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple051', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('미황사', 34.3828873, 126.5773481, '전라남도 해남군 송지면 미황사길 164', '전남', TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple052', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('반야사', 36.2805436, 127.9092579, '충청북도 영동군 황간면 백화산로 652', '충북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple053', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('백담사', 38.1651533, 128.3740948, '강원특별자치도 인제군 북면 백담로 746', '강원', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple054', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('백련사(가평)', 37.7833158, 127.3501714, '경기도 가평군 상면 샘골길 159-50', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple055', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('백련사(강진)', 34.5877226, 126.7482083, '전라남도 강진군 도암면 백련사길 145', '전남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple056', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('백양사', 35.4394999, 126.8833575, '전라남도 장성군 북하면 백양로 1239', '전남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple057', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('백제사', 33.4487759, 126.4242169, '제주특별자치도 제주시 애월읍 광령남6길 54', '제주', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple058', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('범어사', 35.2781147, 129.0734762, '부산광역시 금정구 상마1길 20', '부산', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple059', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('법륜사', 37.1695873, 127.2984987, '경기도 용인시 처인구 원삼면 농촌파크로 126', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple060', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('법주사', 36.5415497, 127.8331760, '충청북도 보은군 속리산면 법주사로 405', '충북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple061', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('보경사', 36.2522790, 129.3179490, '경상북도 포항시 북구 송라면 보경로 523', '경북', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple062', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('보광사(파주)', 37.7530657, 126.9197769, '경기도 파주시 광탄면 보광로474번길 87', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple063', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('보덕관음사', 37.2021400, 127.2651463, '경기도 용인시 처인구 운학로 187', '경기', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple064', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('보림사(장흥)', 34.8205779, 126.8910669, '전남 장흥군 유치면 보림사로 224', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple065', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('보현사', 37.7368530, 128.7695405, '강원특별자치도 강릉시 성산면 보현길 396', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple066', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('봉녕사', 37.2915107, 127.0374719, '경기도 수원시 팔달구 창룡대로 236-54', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple067', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('봉선사', 37.7473501, 127.1836131, '경기도 남양주시 진접읍 봉선사길 32', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple068', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('봉은사', 37.5148520, 127.0573766, '서울특별시 강남구 봉은사로 531', '서울', FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, '@temple069', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('봉인사', 37.6620421, 127.2177665, '경기도 남양주시 진건읍 사릉로156번길 295', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple070', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('봉정사', 36.6532709, 128.6629033, '경상북도 안동시 서후면 봉정사길 222', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple071', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('부석사', 36.7036581, 126.4124372, '충청남도 서산시 부석면 부석사길 243', '충남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple072', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('불갑사', 35.2007754, 126.5498501, '전라남도 영광군 불갑면 불갑사로 450', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple073', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('불국사', 35.7898804, 129.3318909, '경상북도 경주시 불국로 385', '경북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple074', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('불회사', 34.9084081, 126.8229434, '전라남도 나주시 다도로 1224-142', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple075', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('붓다선원', 35.8766671, 127.8946302, '경상남도 거창군 웅양면 개화길 397-115', '경남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple076', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('사나사', 37.5381867, 127.5063078, '경기도 양평군 옥천면 사나사길 329', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple077', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('사성암', 35.1799672, 127.4807355, '전라남도 구례군 문척면 사성암길303', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple078', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('삼운사', 37.8882819, 127.7414247, '강원특별자치도 춘천시 후석로441번길 12', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple079', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('삼화사', 37.4638354, 129.0143586, '강원특별자치도 동해시 삼화로 584', '강원', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple080', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('서고사', 35.8350797, 127.0850062, '전라북도 전주시 정여립로 1010-90', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple081', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('서광사', 36.7915088, 126.4454870, '충청남도 서산시 부춘산1로 44', '충남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple082', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('석불사', 37.5359621, 126.9447565, '서울특별시 마포구 마포대로4다길 23-6', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple083', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('석왕사', 37.4910410, 126.7936836, '경기도 부천시 원미구 소사로 367', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple084', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('석종사', 36.9482764, 127.9694412, '충청북도 충주시 직동길 271-56', '충북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple085', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('선본사', 35.9874659, 128.7393043, '경상북도 경산시 갓바위로 699', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple086', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('선암사(부산)', 35.1769370, 129.0277633, '부산광역시 부산진구 백양산로 138', '부산', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple087', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('선암사(순천)', 34.9960451, 127.3304767, '전라남도 순천시 승주읍 선암사길 450', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple088', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('선운사', 35.4969385, 126.5782255, '전북특별자치도 고창군 아산면 선운사로 250', '전북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple089', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('설악산신흥사', 38.1758427, 128.4845537, '강원특별자치도 속초시 설악산로 1137', '강원', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple090', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('성주사', 35.1768948, 128.7172793, '경상남도 창원시 성산구 곰절길 191', '경남', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple091', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('성흥사', 35.1478862, 128.7793645, '경남 창원시 진해구 대장로273', '경남', TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple092', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('송광사(순천)', 35.0021207, 127.2758818, '전라남도 순천시 송광면 송광사안길 100', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple093', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('송광사(완주)', 35.8855971, 127.2420789, '전라북도 완주군 소양면 송광수만로 255-16', '전북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple094', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('수국사', 37.6159229, 126.9050875, '서울특별시 은평구 서오릉로 23길 8-5', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple095', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('수덕사', 36.6630169, 126.6225493, '충청남도 예산군 덕산면 수덕사안길 79', '충남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple096', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('수원사', 37.2804508, 127.0189577, '경기도 수원시 팔달구 수원천로 300', '경기', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, '@temple097', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('수진사', 37.6716125, 127.2507780, '경기도 남양주시 천마산로 115-13', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple098', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('신광사', 34.8816806, 128.5035715, '경상남도 거제시 사등면 오량2길 108', '경남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple099', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('신륵사', 37.2974985, 127.6615769, '경기도 여주시 신륵사길 73', '경기', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple100', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('신안사', 36.1708537, 127.5826165, '충청남도 금산군 제원면 신안사로 970', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple101', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('신흥사(완도)', 34.3073749, 126.7550106, '전라남도 완도군 완도읍 청해진남로 101-1', '전남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple102', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('실상사', 35.4164166, 127.6354004, '전북특별자치도 남원시 산내면 실상사길 265', '전북', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple103', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('심원사(성주)', 35.8004858, 128.1357910, '경상북도 성주군 수륜면 가야산식물원길 17-56', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple104', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('심택사', 37.5972525, 126.9333064, '서울특별시 은평구 은평로20나길 5-23', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple105', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('쌍계사(하동)', 35.2324978, 127.6505776, '경상남도 하동군 화개면 쌍계사길 59', '경남', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple106', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('쌍봉사', 34.8877203, 127.0606163, '전라남도 화순군 이양면 쌍산의로 459', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple107', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('안국사', 35.9441966, 127.6916048, '전라북도 무주군 적상면 산성로 1050', '전북', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple108', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('약수사', 37.4593530, 126.9343940, '서울특별시 관악구 약수암1길 28', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple109', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('약천사', 33.2461544, 126.4494597, '제주특별자치도 서귀포시 이어도로 293-28', '제주', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, '@temple110', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('연곡사', 35.2543175, 127.5886171, '전라남도 구례군 토지면 피아골로 774', '전남', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple111', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('연등국제선원', 37.6721162, 126.4834358, '인천광역시 강화군 길상면 강화동로 349-60', '인천', TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple112', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('연운사', 37.6491117, 126.6493828, '경기도 김포시 양촌읍 석모로5번길 48-11', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple113', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('연주암', 37.4418617, 126.9653131, '경기도 과천시 자하동길 63', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple114', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('영국사', 36.1581457, 127.6105204, '충청북도 영동군 양산면 영국동길 225-35', '충북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple115', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('영랑사', 36.9124508, 126.5939678, '충청남도 당진시 고대면 진관로 142-52', '충남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple116', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('영평사', 36.4733507, 127.2277683, '세종특별자치시 장군면 영평사길 124', '세종', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple117', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('옥천사', 35.0802900, 128.2623538, '경상남도 고성군 개천면 연화산1로 471-9', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple118', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('옥천암', 37.5969852, 126.9542463, '서울특별시 서대문구 홍지문길 1-38', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple119', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용문사(남해)', 34.7879899, 127.9233383, '경상남도 남해군 이동면 용문사길 166-11', '경남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple120', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용문사(양평)', 37.5501859, 127.5708230, '경기도 양평군 용문면 용문산로 782', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple121', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용문사(예천)', 36.7313810, 128.3694867, '경상북도 예천군 용문면 용문사길 285-30', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple122', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용연사', 37.7899023, 128.7803711, '강원특별자치도 강릉시 사천면 중앙서로 961', '강원', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple123', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용주사', 37.2120183, 127.0050520, '경기도 화성시 용주로 135-6', '경기', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple124', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용화사(청주)', 36.6416246, 127.4820829, '충청북도 청주시 서원구 무심서로 565', '충북', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple125', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용화사(통영)', 34.8185644, 128.4155837, '경상남도 통영시 봉수로 107-82', '경남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple126', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('용흥사', 35.3408912, 126.8890233, '전라남도 담양군 월산면 용흥사길 442', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple127', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('운주사', 34.9254769, 126.8800382, '전라남도 화순군 도암면 천태로 91-44', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple128', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('원효사', 35.1486369, 126.9857710, '광주광역시 북구 무등로 1514-35', '광주', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple129', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('월정사', 37.7319381, 128.5928851, '강원특별자치도 평창군 진부면 오대산로 374-8', '강원', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, '@temple130', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('육지장사', 37.7836853, 126.9439745, '경기도 양주시 백석읍 기산로471번길 190', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple131', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('은해사', 35.9918840, 128.7898188, '경상북도 영천시 청통면 은해사로 300', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple132', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('이제사', 36.4908251, 127.0210092, '충남 공주시 사곡면 다복골길 73-6', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple133', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('자비선사', 35.7941058, 128.2204364, '경상북도 성주군 수륜면 계정길 208', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple134', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('장육사', 36.5987266, 129.3011138, '경상북도 영덕군 창수면 장육사1길 172', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple135', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('전등사', 37.6317933, 126.4845478, '인천광역시 강화군 길상면 전등사로 37-41', '인천', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple136', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('정토사', 37.4264799, 127.0676894, '경기도 성남시 수정구 옛골로 42번길 3', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple137', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('정혜사', 35.0618370, 127.5141183, '전라남도 순천시 서면 정혜사길 32', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple138', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('조계사', 37.5738369, 126.9822020, '서울특별시 종로구 우정국로 55', '서울', FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, '@temple139', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('죽림사', 35.9445006, 128.9163683, '경상북도 영천시 금호읍 죽방길 279-57', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple140', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('죽림사(포항)', 36.0364582, 129.3576464, '경북 포항시 북구 탑산길 10번길 11-4', '경북', TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple141', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('중흥사', 37.6460584, 126.9766199, '경기도 고양시 덕양구 대서문길 393', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple142', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('증심사', 35.1287490, 126.9698984, '광주광역시 동구 증심사길 177', '광주', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple143', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('지장정사', 36.3299374, 127.1127405, '충청남도 논산시 노성면 화곡안길 103', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple144', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('직지사', 36.1170395, 128.0044810, '경상북도 김천시 대항면 직지사길 95', '경북', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple145', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('진관사', 37.6383876, 126.9464060, '서울특별시 은평구 진관길 73', '서울', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple146', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('천은사', 35.2737008, 127.4763333, '전라남도 구례군 광의면 노고단로 209', '전남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple147', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('천축사', 37.6942680, 127.0193006, '서울특별시 도봉구 도봉산길 92-2', '서울', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple148', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('청계사', 35.2151428, 127.8560792, '경남 하동군 옥종면 안계길 67-182', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple149', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('청량사', 36.7894419, 128.9189913, '경상북도 봉화군 청량산길 199-152', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple150', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('청련사', 37.7458555, 126.4485168, '인천광역시 강화군 강화읍 고비고개로 188번길 112(국화리)', '인천', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple151', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('청평사', 37.9858676, 127.8086468, '강원특별자치도 춘천시 북산면 오봉산길 810', '강원', FALSE, TRUE, TRUE, FALSE, FALSE, TRUE, '@temple152', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('축서사', 36.9814412, 128.7999096, '경상북도 봉화군 물야면 월계길 739', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple153', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('통도사', 35.4879503, 129.0643366, '경상남도 양산시 하북면 통도사로 108', '경남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple154', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('통합정보센터', 37.5738835, 126.9831643, '서울특별시 종로구 우정국로 56', '서울', FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, '@temple155', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('팔공산석굴암', 36.0477224, 128.6406409, '대구광역시 군위군 부계면 남산4길24(제2석굴암)', '대구', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple156', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('표충사', 35.5325933, 128.9605778, '경상남도 밀양시 표충로 1338', '경남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple157', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('학림사', 36.3649803, 127.2475716, '충청남도 공주시 반포면 제석골길 35-45', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple158', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('한국문화연수원', 36.5654006, 127.0100239, '충청남도 공주시 사곡면 마곡사로 1065', '충남', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple159', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('해인사', 35.8011781, 128.0980980, '경상남도 합천군 가야면 해인사길 122', '경남', FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, '@temple160', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('향일암', 34.5916198, 127.8039319, '전라남도 여수시 돌산읍 향일암로 60', '전남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple161', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('현덕사', 37.8592813, 128.7035153, '강원특별자치도 강릉시 연곡면 싸리골길 170', '강원', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple162', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('홍법사', 35.3035939, 129.1101843, '부산광역시 금정구 두구로33번길 202', '부산', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple163', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('화계사', 37.6326445, 127.0073066, '서울특별시 강북구 화계사길 117', '서울', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, '@temple164', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('화암사', 38.2268820, 128.4695206, '강원특별자치도 고성군 토성면 화암사길 100', '강원', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple165', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('화엄사', 35.2554686, 127.4972541, '전라남도 구례군 마산면 화엄사로 539', '전남', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, '@temple166', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('화운사', 37.2528180, 127.1620089, '경기도 용인시 처인구 동백죽전대로 111-14', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple167', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('회암사(양주)', 37.8505301, 127.1077265, '경기도 양주시 회암사길 281', '경기', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple168', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('흥국사(고양)', 37.6636889, 126.9399149, '경기도 고양시 덕양구 흥국사길 82', '경기', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, '@temple169', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('흥국사(여수)', 34.8211501, 127.7002713, '전라남도 여수시 흥국사길 160', '전남', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple170', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE),
    ('희방사', 36.9199750, 128.4570280, '경상북도 영주시 풍기읍 죽령로1720번길 278', '경북', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, '@temple171', '$2a$10$zFTFyr.64hSAp4DpV7G9hexZvBaDZfAIGemGyz0qVDkNUCoiykFcm', TRUE);


-- 템플스테이 프로그램 더미값(테스트용) - latitude/longitude/support_english는 trg_program_inherit_*
-- 트리거가 소속 TEMPLE 값으로 저장 시점에 덮어쓰므로 여기 넣는 값은 의미 없음(트리거 조건 통과용).
-- temple_id를 이름으로 서브쿼리하는 이유: AUTO_INCREMENT 값이 리셋 순서에 따라 달라질 수 있어서.
INSERT INTO TEMPLE_STAY_PROGRAM (temple_id, title, program_type, image_url, description, schedule, required_items, price, duration, open_start_date, open_end_date, max_participant, support_english, latitude, longitude) VALUES
    ((SELECT temple_id FROM TEMPLE WHERE name = '테스트사찰'), '테스트', '당일형', 'https://res.cloudinary.com/hquhccft/image/upload/v1788334684/SCIT-14-3/xgniosoeldeizlmwuztk.png', '테스트 프로그램', '테스트 일정표', '테스트 준비물', 100, '당일', '2026-09-02', '2026-09-30', 20, FALSE, 0, 0),
    ((SELECT temple_id FROM TEMPLE WHERE name = '테스트사찰2'), '숲길 명상 1박2일', '휴식형', 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=1200&h=800&fit=crop&auto=format', '숲길을 걸으며 마음을 정돈하는 1박2일 휴식형 템플스테이입니다.', '1일차 15:00 입소 및 오리엔테이션\n1일차 18:00 저녁 발우공양\n1일차 19:30 저녁 예불\n2일차 04:30 새벽 예불\n2일차 09:00 아침 공양 후 퇴소', '개인 세면도구, 편한 활동복, 양말(법당 착석용)', 89000, '1박2일', '2026-09-01', '2026-10-31', 20, FALSE, 0, 0);
