-- ============================================================
-- 불교 종합 사이트 데이터베이스 생성 스크립트 (MySQL 8.0 기준)
-- ============================================================

CREATE DATABASE IF NOT EXISTS buddhist_site
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE buddhist_site;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS favorite_temple;
DROP TABLE IF EXISTS temple_stay_review;
DROP TABLE IF EXISTS temple_stay_reservation;
DROP TABLE IF EXISTS temple_stay_program;
DROP TABLE IF EXISTS moktak;
DROP TABLE IF EXISTS buddhism_info;
DROP TABLE IF EXISTS daily_quote;
DROP TABLE IF EXISTS temple_food_recommendation;
DROP TABLE IF EXISTS temple;
DROP TABLE IF EXISTS userEntity;

SET FOREIGN_KEY_CHECKS = 1;


-- ------------------------------------------------------------
-- 1. userEntity (회원)
--    - role 컬럼으로 관리자/일반 회원을 구분합니다.
--    - moktak_count / moktak_count_date 조합으로 "오늘 목탁 친 횟수"를
--      관리합니다. 목탁을 두드릴 때 moktak_count_date가 오늘과 다르면
--      moktak_count를 0으로 초기화한 뒤 1을 더하는 방식(지연 초기화)을
--      애플리케이션 로직에서 처리합니다.
--    - status/withdrawn_at이 없으므로 탈퇴 처리는 행을 실제로
--      DELETE 하는 방식으로 구현해야 합니다.
-- ------------------------------------------------------------
CREATE TABLE userEntity (
    user_id            BIGINT UNSIGNED AUTO_INCREMENT COMMENT '회원 고유 번호',
    email              VARCHAR(100)  NOT NULL COMMENT '로그인 이메일',
    password           VARCHAR(255)  NOT NULL COMMENT '암호화된 비밀번호(해시값)',
    nickname           VARCHAR(30)   NOT NULL COMMENT '커뮤니티 닉네임',
    phone              VARCHAR(20)   NULL COMMENT '연락처',
    role               ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '일반 회원/관리자 구분',
    moktak_count       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '오늘 목탁 친 횟수(매일 초기화)',
    moktak_count_date  DATE NULL COMMENT '위 카운트의 기준 날짜(오늘과 다르면 조회/타격 시 0으로 초기화)',
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_nickname (nickname),
    CONSTRAINT chk_user_email_format CHECK (email LIKE '%_@_%.__%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 정보';


-- ------------------------------------------------------------
-- 2. temple (사찰)
--    - 주소/좌표/설명 등 상세 정보는 지도 API에서 조회하므로 저장하지
--      않고, 템플스테이 프로그램과 연결하기 위한 최소 정보만 둡니다.
-- ------------------------------------------------------------
CREATE TABLE temple (
    temple_id     BIGINT UNSIGNED AUTO_INCREMENT COMMENT '사찰 고유 번호(자체 DB 기준)',
    name          VARCHAR(100) NOT NULL COMMENT '사찰 이름(목록/상세 표시용)',
    api_place_id  VARCHAR(100) NOT NULL COMMENT '지도 API 장소 고유 ID (주소/좌표/설명 등은 API로 조회)',
    PRIMARY KEY (temple_id),
    UNIQUE KEY uk_temple_api_place_id (api_place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='템플스테이 운영 사찰(상세 정보는 지도 API 연동)';


-- ------------------------------------------------------------
-- 3. temple_stay_program (템플스테이 프로그램)
-- ------------------------------------------------------------
CREATE TABLE temple_stay_program (
    program_id         BIGINT UNSIGNED AUTO_INCREMENT COMMENT '프로그램 고유 번호',
    temple_id          BIGINT UNSIGNED NOT NULL COMMENT '운영 사찰',
    title               VARCHAR(100) NOT NULL COMMENT '프로그램명',
    description          TEXT NULL COMMENT '프로그램 설명',
    price                INT UNSIGNED NOT NULL COMMENT '참가 비용(원)',
    duration             VARCHAR(20) NOT NULL COMMENT '진행 기간 (예: 1박2일)',
    max_participant      INT UNSIGNED NOT NULL COMMENT '회차당 최대 인원',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
    PRIMARY KEY (program_id),
    CONSTRAINT fk_program_temple FOREIGN KEY (temple_id)
        REFERENCES temple (temple_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_program_max_participant CHECK (max_participant > 0),
    INDEX idx_program_temple (temple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='템플스테이 프로그램';


-- ------------------------------------------------------------
-- 4. temple_stay_reservation (템플스테이 문의+예약, 통합 테이블)
--    - 기존 temple_stay_inquiry + temple_stay_reservation을 합쳤습니다.
--    - status 값으로 흐름을 관리합니다:
--      문의 -> 답변완료 -> 예약확정 -> 이용완료 (또는 언제든 취소)
--    - 문의 단계에서는 날짜/인원이 정해지지 않았을 수 있어 NULL을 허용합니다.
-- ------------------------------------------------------------
CREATE TABLE temple_stay_reservation (
    reservation_id      BIGINT UNSIGNED AUTO_INCREMENT COMMENT '문의/예약 고유 번호',
    user_id              BIGINT UNSIGNED NOT NULL COMMENT '신청 회원',
    program_id           BIGINT UNSIGNED NOT NULL COMMENT '대상 프로그램',
    start_date            DATE NULL COMMENT '이용 시작일(문의 단계에서는 비어있을 수 있음)',
    end_date               DATE NULL COMMENT '이용 종료일',
    participant_count      INT UNSIGNED NULL COMMENT '신청 인원',
    content                 TEXT NOT NULL COMMENT '문의/요청 내용',
    answer                   TEXT NULL COMMENT '관리자 답변',
    status                    ENUM('문의','답변완료','예약확정','취소','이용완료') NOT NULL DEFAULT '문의' COMMENT '진행 상태',
    canceled_at               DATETIME NULL COMMENT '취소 처리일시',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 신청일시',
    PRIMARY KEY (reservation_id),
    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id)
        REFERENCES userEntity (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservation_program FOREIGN KEY (program_id)
        REFERENCES temple_stay_program (program_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_reservation_dates CHECK (
        start_date IS NULL OR end_date IS NULL OR start_date <= end_date
    ),
    CONSTRAINT chk_reservation_participant CHECK (
        participant_count IS NULL OR participant_count > 0
    ),
    CONSTRAINT chk_reservation_canceled_at CHECK (
        (status = '취소' AND canceled_at IS NOT NULL)
        OR (status <> '취소' AND canceled_at IS NULL)
    ),
    INDEX idx_reservation_user (user_id),
    INDEX idx_reservation_program (program_id),
    INDEX idx_reservation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='템플스테이 문의+예약 통합';


-- ------------------------------------------------------------
-- 5. temple_stay_review (템플스테이 리뷰, 첨부 이미지 + 추천수 포함)
-- ------------------------------------------------------------
CREATE TABLE temple_stay_review (
    review_id       BIGINT UNSIGNED AUTO_INCREMENT COMMENT '리뷰 고유 번호',
    reservation_id  BIGINT UNSIGNED NOT NULL COMMENT '리뷰 대상 예약 (1예약=1리뷰)',
    user_id         BIGINT UNSIGNED NOT NULL COMMENT '리뷰 작성 회원',
    rating          TINYINT UNSIGNED NOT NULL COMMENT '평점(1~5)',
    content         TEXT NOT NULL COMMENT '리뷰 내용',
    image_urls      JSON NULL COMMENT '첨부 이미지 경로 목록(JSON 배열, 없으면 NULL)',
    like_count      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '리뷰 추천 수',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    UNIQUE KEY uk_review_reservation (reservation_id),
    CONSTRAINT fk_review_reservation FOREIGN KEY (reservation_id)
        REFERENCES temple_stay_reservation (reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id)
        REFERENCES userEntity (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_image_urls_type CHECK (
        image_urls IS NULL OR JSON_TYPE(image_urls) = 'ARRAY'
    ),
    INDEX idx_review_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='템플스테이 리뷰(첨부 이미지+추천수 포함)';


-- ------------------------------------------------------------
-- 6. buddhism_info (불교 정보 게시글)
--    - 관리자만 작성하므로 작성자 식별(author_id)은 두지 않습니다.
-- ------------------------------------------------------------
CREATE TABLE buddhism_info (
    post_id      BIGINT UNSIGNED AUTO_INCREMENT COMMENT '게시글 고유 번호',
    title        VARCHAR(150) NOT NULL COMMENT '제목',
    content      TEXT NOT NULL COMMENT '본문',
    view_count   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '조회수',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    PRIMARY KEY (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='불교 정보 게시글(관리자 작성)';


-- ------------------------------------------------------------
-- 7. moktak (목탁)
--    - 실시간 방송이 아니라 사이트 전체에 딱 1개 행만 사용하는
--      "전체 누적 타격 횟수" 카운터 테이블입니다.
--    - 개인별 카운트는 userEntity.moktak_count에서 관리합니다.
-- ------------------------------------------------------------
CREATE TABLE moktak (
    moktak_id    BIGINT UNSIGNED AUTO_INCREMENT COMMENT '목탁 고유 번호(전체 1행만 사용)',
    total_count  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '전체 목탁 친 횟수(누적)',
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막으로 두드린 시각',
    PRIMARY KEY (moktak_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='전체 목탁 타격 카운터(단일 행)';


-- ------------------------------------------------------------
-- 8. daily_quote (불교 한마디)
-- ------------------------------------------------------------
CREATE TABLE daily_quote (
    quote_id     BIGINT UNSIGNED AUTO_INCREMENT COMMENT '한마디 고유 번호',
    content      TEXT NOT NULL COMMENT '한마디 내용',
    source       VARCHAR(100) NULL COMMENT '출처(경전/스님 등)',
    PRIMARY KEY (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='불교 한마디';


-- ------------------------------------------------------------
-- 9. temple_food_recommendation (사찰음식 추천)
-- ------------------------------------------------------------
CREATE TABLE temple_food_recommendation (
    recommendation_id  BIGINT UNSIGNED AUTO_INCREMENT COMMENT '추천 고유 번호',
    food_name            VARCHAR(50) NOT NULL COMMENT '음식명',
    description           TEXT NULL COMMENT '음식 설명',
    recipe                TEXT NULL COMMENT '레시피',
    image_url             VARCHAR(255) NULL COMMENT '음식 사진 경로',
    PRIMARY KEY (recommendation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사찰음식 추천';


-- ------------------------------------------------------------
-- 10. favorite_temple (관심 사찰 즐겨찾기)
--     - 회원이 사찰을 즐겨찾기할 때 사용합니다.
--     - (user_id, temple_id) 조합에 UNIQUE를 걸어 같은 사찰을
--       중복으로 즐겨찾기할 수 없도록 합니다.
-- ------------------------------------------------------------
CREATE TABLE favorite_temple (
    favorite_id  BIGINT UNSIGNED AUTO_INCREMENT COMMENT '즐겨찾기 고유 번호',
    user_id      BIGINT UNSIGNED NOT NULL COMMENT '즐겨찾기한 회원',
    temple_id    BIGINT UNSIGNED NOT NULL COMMENT '즐겨찾기 대상 사찰',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '즐겨찾기 등록일시',
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uk_favorite_user_temple (user_id, temple_id),
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id)
        REFERENCES userEntity (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favorite_temple FOREIGN KEY (temple_id)
        REFERENCES temple (temple_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_favorite_user (user_id),
    INDEX idx_favorite_temple (temple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='관심 사찰 즐겨찾기';
