# 불교 종합 사이트 DB 설계 문서

## 1. 문서 개요

이 문서는 불교 종합 사이트(佛선자) 팀 프로젝트에서 사용하는 데이터베이스 구조를 정리한 문서입니다.
대상 DBMS는 MySQL 8.0이며 테이블 18개, 외래키(FK) 23개, 트리거 2개로 이루어져 있습니다.
각 테이블의 컬럼·제약조건은 DDL 스크립트 [`01-schema.sql`](../sql/01-schema.sql)을 기준으로 작성했습니다.

아래 기능을 기준으로 테이블을 설계했습니다.

1. 불교 정보(불교란?/불교 용어/사찰 예절 가이드) — DB 없이 정적 페이지 + 사전형식 번역으로 제공
2. 사찰 찾기 + 지도 (좌표 기반 검색/필터), 사찰 행사
3. 템플스테이 프로그램 조회, 예약(참가자/결제 포함), 리뷰
4. 즐겨찾기(사찰/행사/한마디/음식/리뷰)
5. 오늘의 불교 한마디, 사찰 음식 추천
6. 회원가입/로그인(일반+카카오)/정보수정/탈퇴, 1:1 문의(사이트 관리자·사찰 대상)
7. 사찰 관리자 계정 및 사찰 등록 요청(승인제)

더미 데이터(테스트 계정, 사찰, 프로그램, 예약/리뷰, 행사, 사찰음식, 한마디, 즐겨찾기)는 [`02-dummy-data.sql`](../sql/02-dummy-data.sql) 한 파일에 INSERT로 들어 있습니다.
새 DB에서 01 → 02 순서로 한 번씩 실행하면 됩니다(두 파일 모두 DROP / DELETE / UPDATE가 없어서 이미 데이터가 있는 DB에는 실행하지 마세요).

### 주요 설계 결정

| 항목 | 결정 내용 |
|---|---|
| 회원/사찰 계정 구분 | 둘 다 로그인 아이디를 쓰지만 테이블이 분리되어 있음 — 일반 회원은 `USER`, 사찰 관리자 계정은 `TEMPLE`에 직접 딸려 있음(`TEMPLE.login_id`는 `@`로 시작해야 하고 `USER.login_id`는 `@`로 시작할 수 없도록 CHECK 제약). 사이트 관리자(ADMIN)는 `USER.role`로 구분. |
| 불교 정보(용어/예절가이드/불교란?) | 값이 고정적이고 자주 안 바뀌는 콘텐츠라 DB 테이블 대신 템플릿에 직접 고정하고, 다국어는 사전형식(`*.i18n.js`)으로 처리함. |
| 사찰 위치 정보 | 지도 API 장소 ID 대신 위도/경도(`latitude`/`longitude`)를 직접 저장. `TEMPLE_STAY_PROGRAM`은 트리거로 소속 사찰의 좌표·영어 지원 여부를 저장 시점에 그대로 상속받음. |
| 환불 규정·유의사항 | 사찰마다 공통이라 프로그램이 아니라 `TEMPLE.refund_policy` / `TEMPLE.special_notice`에 두고, 프로그램 조회 시 사찰을 조인해서 항상 최신값을 보여줌. |
| 문의 | 예약은 승인 절차 없이 선착순으로 바로 확정되므로 예약에 "문의" 단계가 없음. 문의는 `INQUIRY`(회원 → 사이트 관리자)와 `TEMPLE_INQUIRY`(회원 → 사찰, 예약 취소 요청 등)로 분리. |
| 예약-참가자-결제 분리 | 예약 1건에 참가자가 여러 명일 수 있어 `RESERVATION_PARTICIPANT`로 분리(1:N). 결제는 예약 1건당 1건이라 `PAYMENT`로 분리(1:1, UNIQUE). |
| 결제 방식과 예약 상태 | 카드 결제(토스페이먼츠)는 즉시 `예약확정`. 계좌이체(무통장입금)는 `예약대기`로 걸어두고 사찰이 입금을 확인하면 `예약확정`으로 바꾸며, 3일 안에 확정되지 않으면 배치가 자동 `취소`함. |
| 정원 | 프로그램 최대 인원은 전 프로그램 20명 고정(CHECK). 동시 신청에도 초과하지 않도록 애플리케이션이 프로그램 행 락과 인원 합계 락을 건 트랜잭션에서 확인 후 저장함. |
| 사찰 등록 | 사찰 관계자가 회원가입 없이 신청하는 `TEMPLE_REGISTRATION_REQUEST`를 따로 두고, 관리자가 승인하면 이 행이 승격되는 게 아니라 완전히 새로운 `TEMPLE` 행을 만들고 `approved_temple_id`로 추적함. 요청자 이메일(`contact_email`)은 이 테이블에만 있음. |
| 회원 탈퇴 | 탈퇴를 신청하면 `withdrawal_requested_at`에 일시가 기록되고 30일 유예기간 동안 로그인해서 철회할 수 있음. 기한이 지나면 배치가 탈퇴를 확정해 회원 행을 삭제하고, 예약·리뷰 기록은 전용 계정 `withdrawn_user`("탈퇴한 회원")로 넘겨 남김. `withdrawn_at`은 "로그인할 수 없는 탈퇴 계정"을 표시하는 값으로, 전용 계정 `withdrawn_user`에 채워져 있음(예전에 행을 익명화만 하고 남겨두던 방식으로 처리된 행도 이 값으로 구분하며, 확정 배치가 삭제로 정리함). |
| 평점 | 사찰 평균 평점(`TEMPLE.rating`)과 리뷰 건수(`review_count`)는 리뷰 작성·수정·삭제 때마다 다시 계산해 저장하는 캐시값. 리뷰가 하나도 없으면 `rating`은 NULL. |

---

## 2. 전체 테이블 목록

| 번호 | 테이블명 | 논리명 | 설명 |
|---|---|---|---|
| 1 | USER | 회원 | 일반 회원·사이트 관리자 계정(로컬/카카오 로그인 공통) |
| 2 | TEMPLE | 사찰 | 사찰 정보 + 지도 필터 태그 + 사찰 관리자 계정 |
| 3 | TEMPLE_STAY_PROGRAM | 템플스테이 프로그램 | 사찰이 운영하는 템플스테이 프로그램(상품) |
| 4 | TEMPLE_STAY_RESERVATION | 예약 | 템플스테이 예약 |
| 5 | RESERVATION_PARTICIPANT | 예약 참가자 | 예약 1건당 참가자 인적사항(1:N) |
| 6 | PAYMENT | 예약 결제 | 예약 결제(1:1) — 카드(토스페이먼츠) / 계좌이체 |
| 7 | TEMPLE_STAY_REVIEW | 리뷰 | 템플스테이 리뷰 |
| 8 | FAVORITE_REVIEW | 좋아요한 리뷰 | 좋아요한 리뷰 |
| 9 | FAVORITE_TEMPLE | 관심 사찰 | 관심 사찰 |
| 10 | TEMPLE_EVENT | 사찰 행사 | 사찰 행사 |
| 11 | FAVORITE_EVENT | 관심 행사 | 관심 행사 |
| 12 | DAILY_QUOTE | 오늘의 불교 한마디 | 오늘의 불교 한마디 |
| 13 | FAVORITE_QUOTE | 저장한 한마디 | 저장한 한마디 |
| 14 | TEMPLE_FOOD_RECOMMENDATION | 사찰음식 추천 | 사찰음식 추천 |
| 15 | FAVORITE_FOOD | 관심 사찰음식 | 관심 사찰음식 |
| 16 | TEMPLE_REGISTRATION_REQUEST | 사찰 등록 요청 | 사찰 등록 요청(관리자 승인 대기열) |
| 17 | INQUIRY | 1:1 문의(사이트 관리자 대상) | 회원 → 사이트 관리자 1:1 문의 |
| 18 | TEMPLE_INQUIRY | 1:1 문의(사찰 대상) | 회원 → 사찰 1:1 문의(예약 취소 요청 등) |

> ERD 다이어그램은 [`buddhist-site-erd.svg`](./buddhist-site-erd.svg)(요약)와 [`buddhist-site-erd-full.svg`](./buddhist-site-erd-full.svg) / [`buddhist-site-erd-full.png`](./buddhist-site-erd-full.png)(전체 컬럼·제약조건), MySQL Workbench 원본 [`../images/erd.mwb`](../images/erd.mwb) / [`../images/erd.png`](../images/erd.png)를 참고하세요.

---

## 3. 테이블별 상세 명세

### 3-1. USER (회원)

**설명**: 회원 정보(카카오 로그인 포함)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| login_id | VARCHAR(30) | PK | 로그인 아이디 (변경 불가, @ 시작 불가) |
| password | VARCHAR(255) | NULL 허용 | 비밀번호 (카카오 회원은 NULL) |
| nickname | VARCHAR(30) | UNIQUE, NOT NULL | 법명 (마이페이지에서 본인 수정 가능, 관리자도 회원관리에서 수정 가능) |
| name | VARCHAR(150) | NOT NULL | 실명 (여권 영문 이름 형식, 본인 수정 불가 - 변경은 문의를 통해 관리자가 처리) |
| phone | VARCHAR(20) | NULL 허용 | 연락처 |
| email | VARCHAR(100) | UNIQUE, NULL 허용 | 이메일 (일반회원은 필수, 사이트 관리자 계정은 불필요해서 NULL 허용) |
| role | ENUM('USER','ADMIN') | NOT NULL, DEFAULT 'USER' | 일반/사이트 관리자 |
| login_type | ENUM('LOCAL','KAKAO') | NOT NULL, DEFAULT 'LOCAL' | 가입 경로 |
| withdrawal_requested_at | DATETIME | NULL 허용 | 탈퇴 신청 일시 - NULL이면 정상 회원, 값이 있으면 유예기간(신청일+30일) 중. 이 기간에 로그인하면 철회 가능, 배치가 기한 지난 건을 찾아 탈퇴 확정 처리함 |
| withdrawn_at | DATETIME | NULL 허용 | 로그인 불가 탈퇴 계정 표시 일시 - 전용 계정 withdrawn_user(탈퇴한 회원)에 채워져 있음. 탈퇴 확정은 회원 행을 삭제하고 예약/리뷰 기록은 이 계정으로 넘기는 방식 |

**추가 제약조건**

- CHECK `chk_user_login_id_no_at`: `login_id NOT LIKE '@%'`
- CHECK `chk_user_login_id_kakao_prefix`: `(login_type = 'KAKAO' AND login_id LIKE 'kakao\_%') OR (login_type = 'LOCAL' AND login_id NOT LIKE 'kakao\_%')`
- CHECK `chk_user_email_required_unless_admin`: `role = 'ADMIN' OR email IS NOT NULL`

### 3-2. TEMPLE (사찰)

**설명**: 사찰 최소 정보 + 지도 필터 태그 + 관리자 계정

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| temple_id | BIGINT | PK, AUTO_INCREMENT | 사찰 고유 번호 |
| name | VARCHAR(100) | NOT NULL | 사찰 이름 |
| image_url | VARCHAR(255) | NULL 허용 | 사찰 대표 이미지 경로 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |
| address | VARCHAR(255) | NOT NULL | 주소 |
| region | VARCHAR(20) | NOT NULL | 지역(시/도) 필터 |
| support_sea | BOOLEAN | NOT NULL, DEFAULT FALSE | 바다 인근 여부 |
| support_mountain | BOOLEAN | NOT NULL, DEFAULT FALSE | 산 인근 여부 |
| support_river | BOOLEAN | NOT NULL, DEFAULT FALSE | 강 인근 여부 |
| support_urban | BOOLEAN | NOT NULL, DEFAULT FALSE | 도심 인근 여부 |
| support_english | BOOLEAN | NOT NULL, DEFAULT FALSE | 영어 지원 여부 |
| is_temple | BOOLEAN | NOT NULL, DEFAULT TRUE | 실제 사찰 건물 여부 |
| rating | DECIMAL(2,1) | NULL 허용 | 리뷰 평균 평점(소속 리뷰 없으면 NULL) |
| review_count | INT | NOT NULL, DEFAULT 0 | 평균에 반영된 리뷰 건수 |
| special_notice | TEXT | NULL 허용 | 사찰별 개별 유의사항 (프로그램 상세의 유의사항으로도 그대로 쓰임) |
| refund_policy | TEXT | NULL 허용 | 환불 규정 (사찰 공통, 프로그램 등록 폼에서 안 받고 여기서만 관리) |
| login_id | VARCHAR(30) | UNIQUE, NOT NULL | 사찰 관리자 계정 아이디 (@ 시작 고정) |
| password | VARCHAR(255) | NOT NULL | 사찰 관리자 계정 비밀번호(암호화) |
| must_change_password | BOOLEAN | NOT NULL, DEFAULT FALSE | 관리자가 임시 비밀번호를 발급했으면 TRUE - 로그인 시 비밀번호 변경 페이지로 강제 이동 |

**추가 제약조건**

- CHECK `chk_temple_login_id_at`: `login_id LIKE '@%'`

### 3-3. TEMPLE_STAY_PROGRAM (템플스테이 프로그램)

**설명**: 템플스테이 프로그램 (한국어는 기본 지원, 외국어는 영어만 지원)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| program_id | BIGINT | PK, AUTO_INCREMENT | 프로그램 고유 번호 |
| temple_id | BIGINT | FK → TEMPLE, NOT NULL | 운영 사찰 |
| title | VARCHAR(100) | NOT NULL | 프로그램명 |
| program_type | ENUM('당일형','체험형','휴식형') | NOT NULL | 유형 (당일형=1일, 체험형/휴식형=1박2일 고정) |
| image_url | VARCHAR(255) | NOT NULL | 프로그램 대표 이미지 경로 (필수) |
| description | TEXT | NULL 허용 | 소개 |
| schedule | TEXT | NULL 허용 | 일정표 |
| required_items | TEXT | NULL 허용 | 준비물 |
| price | INT | NOT NULL | 참가 비용(원, 1인 기준) |
| duration | VARCHAR(20) | NOT NULL | 진행 기간 표기(예: 당일, 1박 2일) - 실제 체류 기간 |
| open_start_date | DATE | NOT NULL | 모집(운영) 시작일 |
| open_end_date | DATE | NOT NULL | 모집(운영) 종료일 |
| max_participant | INT | NOT NULL, DEFAULT 20 | 최대 인원 (전 프로그램 공통 20명 고정) |
| support_english | BOOLEAN | NOT NULL, DEFAULT FALSE | 영어 진행 여부. 트리거로 소속 TEMPLE.support_english 상속 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도. 트리거로 소속 TEMPLE.latitude 상속 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도. 트리거로 소속 TEMPLE.longitude 상속 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

**추가 제약조건**

- CHECK `chk_program_max_participant`: `max_participant = 20`
- CHECK `chk_program_open_dates`: `open_end_date >= open_start_date`
- 트리거 `trg_program_inherit_before_insert` / `trg_program_inherit_before_update`: 저장 시점에 `support_english`, `latitude`, `longitude`를 소속 TEMPLE의 현재 값으로 덮어씀(TEMPLE 쪽 값이 나중에 바뀌어도 이미 등록된 프로그램에는 자동 반영되지 않음)

### 3-4. TEMPLE_STAY_RESERVATION (예약)

**설명**: 템플스테이 예약

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| reservation_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, NOT NULL | 신청 대표 회원 |
| program_id | BIGINT | FK → TEMPLE_STAY_PROGRAM, NOT NULL | 대상 프로그램 |
| start_date | DATE | NOT NULL | 이용 시작일 |
| end_date | DATE | NOT NULL | 이용 종료일 (계산 결과를 명시적으로 저장) |
| participant_count | INT | NOT NULL | 신청 인원 |
| note | TEXT | NULL 허용 | 전달사항(비고) |
| lang | VARCHAR(2) | NOT NULL, DEFAULT 'ko' | 예약 시점 화면 언어(ko/ja/en) - 안내 메일 언어 |
| program_title_snapshot | VARCHAR(150) | NOT NULL | 신청 시점 화면 언어로 번역된 프로그램명(안내 메일용) |
| temple_name_snapshot | VARCHAR(150) | NOT NULL | 신청 시점 화면 언어로 번역된 사찰명(안내 메일용) |
| status | ENUM('예약대기','예약확정','취소','이용완료') | NOT NULL, DEFAULT '예약확정' | 진행 상태 |
| canceled_at | DATETIME | NULL 허용 | 취소일시 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 신청일시 |

**추가 제약조건**

- CHECK `chk_reservation_dates`: `end_date >= start_date`

### 3-5. RESERVATION_PARTICIPANT (예약 참가자)

**설명**: 예약 참가자별 인적사항

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| participant_id | BIGINT | PK, AUTO_INCREMENT | 참가자 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION (ON DELETE CASCADE), NOT NULL | 소속 예약 |
| name | VARCHAR(50) | NOT NULL | 이름(여권 영문 이름 형식) |
| gender | ENUM('남성','여성') | NOT NULL | 성별 |
| email | VARCHAR(100) | NOT NULL | 참가자 이메일 |
| phone | VARCHAR(20) | NULL 허용 | 연락처(대표자만 입력, 나머지는 NULL) |

### 3-6. PAYMENT (예약 결제)

**설명**: 예약 결제

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| payment_id | BIGINT | PK, AUTO_INCREMENT | 결제 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, UNIQUE, NOT NULL | 결제 대상 예약(1예약=1결제) |
| payment_method | ENUM('계좌이체','카드') | NOT NULL | 결제 방식(카드는 토스페이먼츠 경유 - 그 안에서 실제 카드/간편결제 등 다양한 수단으로 결제됨) |
| amount | INT | NOT NULL | 결제 금액(원) |
| status | ENUM('대기','완료','취소','환불') | NOT NULL, DEFAULT '대기' | 결제 상태 |
| depositor_name | VARCHAR(50) | NULL 허용 | 입금자명(계좌이체 전용) |
| toss_payment_key | VARCHAR(200) | NULL 허용 | 토스페이먼츠 결제키(카드 전용) |
| payment_detail | VARCHAR(50) | NULL 허용 | 토스 confirm 응답의 실제 결제수단(카드/간편결제 제공자명 등, 카드 전용, 표시용) |
| paid_at | DATETIME | NULL 허용 | 결제 완료 시각 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 결제 시도 등록일시 |

**추가 제약조건**

- CHECK `chk_payment_method_fields`: `status != '완료' OR ( (payment_method = '계좌이체' AND depositor_name IS NOT NULL AND toss_payment_key IS NULL) OR (payment_method = '카드' AND toss_payment_key IS NOT NULL AND depositor_name IS NULL) )`

### 3-7. TEMPLE_STAY_REVIEW (리뷰)

**설명**: 템플스테이 리뷰

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| review_id | BIGINT | PK, AUTO_INCREMENT | 리뷰 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, UNIQUE, NOT NULL | 대상 예약(1예약=1리뷰) |
| login_id | VARCHAR(30) | FK → USER, NOT NULL | 작성 회원 |
| rating | TINYINT | NOT NULL | 평점(1~5) |
| title | VARCHAR(100) | NULL 허용 | 리뷰 제목 (선택 입력) |
| content | TEXT | NOT NULL | 리뷰 내용 |
| image_urls | JSON | NULL 허용 | 첨부 이미지 목록 |
| like_count | INT | NOT NULL, DEFAULT 0 | 추천 수 (캐시값) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 작성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**추가 제약조건**

- CHECK `chk_review_rating`: `rating BETWEEN 1 AND 5`

### 3-8. FAVORITE_REVIEW (좋아요한 리뷰)

**설명**: 좋아요한 리뷰 (중복 좋아요 방지 겸용)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_review_id | BIGINT | PK, AUTO_INCREMENT | 좋아요 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 좋아요한 회원 |
| review_id | BIGINT | FK → TEMPLE_STAY_REVIEW (ON DELETE CASCADE), NOT NULL | 대상 리뷰 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 좋아요 등록일시 |

**추가 제약조건**

- UNIQUE (login_id, review_id) — 중복 등록 방지

### 3-9. FAVORITE_TEMPLE (관심 사찰)

**설명**: 관심 사찰

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 회원 |
| temple_id | BIGINT | FK → TEMPLE (ON DELETE CASCADE), NOT NULL | 사찰 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

**추가 제약조건**

- UNIQUE (login_id, temple_id) — 중복 등록 방지

### 3-10. TEMPLE_EVENT (사찰 행사)

**설명**: 사찰 행사

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| event_id | BIGINT | PK, AUTO_INCREMENT | 행사 고유 번호 |
| temple_id | BIGINT | FK → TEMPLE, NOT NULL | 주최 사찰 |
| title | VARCHAR(150) | NOT NULL | 행사명 |
| description | TEXT | NULL 허용 | 행사 소개 |
| start_date | DATE | NOT NULL | 행사 시작일 |
| end_date | DATE | NOT NULL | 행사 종료일 |
| link_url | VARCHAR(255) | NULL 허용 | 행사 상세/공식 페이지 링크 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

**추가 제약조건**

- CHECK `chk_event_dates`: `end_date >= start_date`

### 3-11. FAVORITE_EVENT (관심 행사)

**설명**: 관심 행사

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_event_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 회원 |
| event_id | BIGINT | FK → TEMPLE_EVENT (ON DELETE CASCADE), NOT NULL | 행사 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

**추가 제약조건**

- UNIQUE (login_id, event_id) — 중복 등록 방지

### 3-12. DAILY_QUOTE (오늘의 불교 한마디)

**설명**: 불교 한마디

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| quote_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| content | TEXT | NOT NULL | 한마디 내용 |
| source | VARCHAR(100) | NULL 허용 | 출처 |

### 3-13. FAVORITE_QUOTE (저장한 한마디)

**설명**: 저장한 불교 한마디

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_quote_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 회원 |
| quote_id | BIGINT | FK → DAILY_QUOTE (ON DELETE CASCADE), NOT NULL | 한마디 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 저장일시 |

**추가 제약조건**

- UNIQUE (login_id, quote_id) — 중복 등록 방지

### 3-14. TEMPLE_FOOD_RECOMMENDATION (사찰음식 추천)

**설명**: 사찰음식 추천

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| recommendation_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| food_name | VARCHAR(50) | NOT NULL | 음식명 |
| description | TEXT | NULL 허용 | 설명 |
| recipe | TEXT | NULL 허용 | 레시피 |
| recipe_url | VARCHAR(255) | NULL 허용 | 레시피 참고 링크 |
| image_url | VARCHAR(255) | NULL 허용 | 사진 |

### 3-15. FAVORITE_FOOD (관심 사찰음식)

**설명**: 관심 사찰음식 즐겨찾기

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_food_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 회원 |
| recommendation_id | BIGINT | FK → TEMPLE_FOOD_RECOMMENDATION (ON DELETE CASCADE), NOT NULL | 음식 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

**추가 제약조건**

- UNIQUE (login_id, recommendation_id) — 중복 등록 방지

### 3-16. TEMPLE_REGISTRATION_REQUEST (사찰 등록 요청)

**설명**: 사찰 관계자가 제출한 사찰 등록 요청(관리자 승인 대기열)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| request_id | BIGINT | PK, AUTO_INCREMENT | 요청 고유 번호 |
| name | VARCHAR(100) | NOT NULL | 사찰 이름 |
| image_url | VARCHAR(255) | NULL 허용 | 사찰 대표 이미지 경로 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |
| address | VARCHAR(255) | NOT NULL | 주소 |
| region | VARCHAR(20) | NOT NULL | 지역(시/도) 필터 |
| support_sea | BOOLEAN | NOT NULL, DEFAULT FALSE | 바다 인근 여부 |
| support_mountain | BOOLEAN | NOT NULL, DEFAULT FALSE | 산 인근 여부 |
| support_river | BOOLEAN | NOT NULL, DEFAULT FALSE | 강 인근 여부 |
| support_urban | BOOLEAN | NOT NULL, DEFAULT FALSE | 도심 인근 여부 |
| support_english | BOOLEAN | NOT NULL, DEFAULT FALSE | 영어 지원 여부 |
| special_notice | TEXT | NULL 허용 | 사찰별 개별 유의사항 |
| refund_policy | TEXT | NULL 허용 | 환불 규정 |
| contact_email | VARCHAR(100) | NOT NULL | 요청자 연락 이메일 - 승인 시 계정정보 발송 대상 (TEMPLE엔 저장 안 됨) |
| status | ENUM('대기','승인') | NOT NULL, DEFAULT '대기' | 처리 상태 |
| approved_temple_id | BIGINT | FK → TEMPLE, NULL 허용 | 승인 후 생성된 TEMPLE 행 추적용(승격이 아니라 별도 생성) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 요청 등록일시 |

### 3-17. INQUIRY (1:1 문의(사이트 관리자 대상))

**설명**: 일반회원이 사이트 관리자에게 남기는 1:1 문의

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| inquiry_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 작성 회원 |
| title | VARCHAR(100) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 문의 내용 |
| answer | TEXT | NULL 허용 | 관리자 답변 |
| status | ENUM('대기','답변완료') | NOT NULL, DEFAULT '대기' | 처리 상태 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 작성일시 |
| answered_at | DATETIME | NULL 허용 | 답변일시 |

### 3-18. TEMPLE_INQUIRY (1:1 문의(사찰 대상))

**설명**: 회원이 사찰에게 남기는 1:1 문의(예약 취소 요청 등)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| inquiry_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER (ON DELETE CASCADE), NOT NULL | 작성 회원 |
| temple_id | BIGINT | FK → TEMPLE, NOT NULL | 문의 대상 사찰 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, NULL 허용 | 관련 예약(있으면) - 예약 취소 요청 등 |
| title | VARCHAR(100) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 문의 내용 |
| answer | TEXT | NULL 허용 | 사찰 답변 |
| status | ENUM('대기','답변완료') | NOT NULL, DEFAULT '대기' | 처리 상태 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 작성일시 |
| answered_at | DATETIME | NULL 허용 | 답변일시 |

---

## 4. 테이블 간 관계(FK) 요약

외래키는 모두 23개입니다. `ON DELETE`가 비어 있는 FK는 기본값(RESTRICT)이라 자식 행이 있으면 부모를 삭제할 수 없습니다.

| 부모 테이블 | 자식 테이블(컬럼) | 관계 | ON DELETE | 설명 |
|---|---|---|---|---|
| TEMPLE | TEMPLE_STAY_PROGRAM (temple_id) | 1:N | - | 한 사찰이 여러 프로그램을 운영 |
| USER | TEMPLE_STAY_RESERVATION (login_id) | 1:N | - | 한 회원이 여러 예약 신청 |
| TEMPLE_STAY_PROGRAM | TEMPLE_STAY_RESERVATION (program_id) | 1:N | - | 한 프로그램에 여러 예약 |
| TEMPLE_STAY_RESERVATION | RESERVATION_PARTICIPANT (reservation_id) | 1:N | CASCADE | 예약 1건에 참가자 여러 명 |
| TEMPLE_STAY_RESERVATION | PAYMENT (reservation_id) | 1:1 | - | 예약 1건당 결제 1건 |
| TEMPLE_STAY_RESERVATION | TEMPLE_STAY_REVIEW (reservation_id) | 1:1 | - | 예약 1건당 리뷰 최대 1개 |
| USER | TEMPLE_STAY_REVIEW (login_id) | 1:N | - | 한 회원이 여러 리뷰 작성 |
| USER | FAVORITE_REVIEW (login_id) | 1:N (N:M 중간) | CASCADE | 리뷰 좋아요(회원 쪽) |
| TEMPLE_STAY_REVIEW | FAVORITE_REVIEW (review_id) | 1:N (N:M 중간) | CASCADE | 리뷰 좋아요(리뷰 쪽) — 회원↔리뷰 N:M 중간 테이블 |
| USER | FAVORITE_TEMPLE (login_id) | 1:N (N:M 중간) | CASCADE | 관심 사찰(회원 쪽) |
| TEMPLE | FAVORITE_TEMPLE (temple_id) | 1:N (N:M 중간) | CASCADE | 관심 사찰(사찰 쪽) — 회원↔사찰 N:M 중간 테이블 |
| TEMPLE | TEMPLE_EVENT (temple_id) | 1:N | - | 한 사찰이 여러 행사 주최 |
| USER | FAVORITE_EVENT (login_id) | 1:N (N:M 중간) | CASCADE | 관심 행사(회원 쪽) |
| TEMPLE_EVENT | FAVORITE_EVENT (event_id) | 1:N (N:M 중간) | CASCADE | 관심 행사(행사 쪽) — 회원↔행사 N:M 중간 테이블 |
| USER | FAVORITE_QUOTE (login_id) | 1:N (N:M 중간) | CASCADE | 저장한 한마디(회원 쪽) |
| DAILY_QUOTE | FAVORITE_QUOTE (quote_id) | 1:N (N:M 중간) | CASCADE | 저장한 한마디(한마디 쪽) — 회원↔한마디 N:M 중간 테이블 |
| USER | FAVORITE_FOOD (login_id) | 1:N (N:M 중간) | CASCADE | 관심 사찰음식(회원 쪽) |
| TEMPLE_FOOD_RECOMMENDATION | FAVORITE_FOOD (recommendation_id) | 1:N (N:M 중간) | CASCADE | 관심 사찰음식(음식 쪽) — 회원↔음식 N:M 중간 테이블 |
| TEMPLE | TEMPLE_REGISTRATION_REQUEST (approved_temple_id) | 1:N | - | 승인 시 만든 새 TEMPLE 행을 가리킴(요청 행이 TEMPLE로 승격되는 것은 아님) |
| USER | INQUIRY (login_id) | 1:N | CASCADE | 한 회원이 여러 문의 작성 |
| USER | TEMPLE_INQUIRY (login_id) | 1:N | CASCADE | 한 회원이 여러 사찰 문의 작성 |
| TEMPLE | TEMPLE_INQUIRY (temple_id) | 1:N | - | 한 사찰에 여러 문의 |
| TEMPLE_STAY_RESERVATION | TEMPLE_INQUIRY (reservation_id) | 1:N | - | 예약 취소 요청 등 관련 예약(선택) |

`USER`·`TEMPLE`의 하위 데이터 중 `ON DELETE CASCADE`인 것(즐겨찾기, 1:1 문의, 예약 참가자)은 부모 삭제 시 함께 지워지고, 예약·리뷰는 삭제할 수 없어서 회원 탈퇴 확정 시 `withdrawn_user` 계정으로 소유자를 옮깁니다.
`DAILY_QUOTE`, `TEMPLE_FOOD_RECOMMENDATION`은 다른 테이블이 FK로 참조만 하고 자신은 아무것도 참조하지 않는 콘텐츠 테이블입니다.

---

## 5. 참고

- **회원 탈퇴 이력 보존이 필요해지면**: 탈퇴 확정 시 회원 행을 삭제하므로 이력이 남지 않습니다. 이력이 필요하면 별도 로그 테이블을 두는 방식을 고려할 수 있습니다.
- **프로그램의 사찰 값 상속**: 트리거는 프로그램 저장 시점에만 동작합니다. 사찰의 좌표·영어 지원 여부를 나중에 수정할 때 기존 프로그램에도 반영하려면 `TEMPLE` 쪽에 별도 트리거가 필요합니다.
- **ENUM 값 추가**: `status`, `program_type` 같은 ENUM 컬럼은 값을 추가할 때 `ALTER TABLE`이 필요합니다.
