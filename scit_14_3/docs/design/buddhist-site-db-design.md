# 불교 종합 사이트 DB 설계 문서

## 1. 문서 개요

이 문서는 불교 종합 사이트(佛선자) 팀 프로젝트에서 사용하는 데이터베이스 구조를 정리한 문서입니다.
아래 기능을 기준으로 테이블을 설계했습니다.

1. 불교 정보(불교란?/불교 용어/사찰 예절 가이드) — DB 없이 정적 페이지 + 사전형식 번역으로 제공
2. 사찰 찾기 + 지도 (좌표 기반 검색/필터), 사찰 행사
3. 템플스테이 프로그램 조회, 예약(참가자/결제 포함), 리뷰
4. 즐겨찾기(사찰/행사/한마디/음식/리뷰)
5. 오늘의 불교 한마디, 사찰 음식 추천
6. 회원가입/로그인(일반+카카오)/정보수정/탈퇴, 1:1 문의
7. 사찰 관리자 계정 및 사찰 등록 요청(승인제)

실제 DB 생성용 DDL(CREATE TABLE) 스크립트는 [`01-buddhist-site-schema.sql`](../sql/01-buddhist-site-schema.sql)에 있습니다.
더미 데이터는 [`03-buddhist-site-program-data.sql`](../sql/03-buddhist-site-program-data.sql)(템플스테이 프로그램),
[`07-temple-stay-seed-data.sql`](../sql/07-temple-stay-seed-data.sql)(예약/리뷰),
[`04-temple-event-seed.sql`](../sql/04-temple-event-seed.sql)(사찰 행사),
[`05-temple-food-seed.sql`](../sql/05-temple-food-seed.sql)(사찰음식),
[`02-buddhist-site-content-data.sql`](../sql/02-buddhist-site-content-data.sql)(오늘의 한마디)를 참고하세요.

### 주요 설계 결정

| 항목 | 결정 내용 |
|---|---|
| 회원/사찰 계정 구분 | 둘 다 로그인 아이디를 쓰지만 테이블이 분리되어 있음 — 일반 회원은 `USER`, 사찰 관리자 계정은 `TEMPLE`에 직접 딸려 있음(`TEMPLE.login_id`가 `@`로 시작하도록 CHECK 제약). 관리자(ADMIN)는 `USER.role`로 구분. |
| 불교 정보(용어/예절가이드/불교란?) | 값이 고정적이고 자주 안 바뀌는 콘텐츠라 DB 테이블(예전엔 `BUDDHISM_INFO`) 대신 템플릿에 직접 고정하고, 다국어는 사전형식(`*.i18n.js`)으로 처리함. 스크래핑된 템플스테이 프로그램/리뷰처럼 값이 크고 자주 바뀌는 콘텐츠만 DB + 브라우저 내장 Translator API로 실시간 번역함. |
| 사찰 위치 정보 | 지도 API 장소 ID 대신 위도/경도(`latitude`/`longitude`)를 직접 저장 — 장소 ID보다 좌표가 정확하다는 판단. `TEMPLE_STAY_PROGRAM`도 트리거로 소속 사찰의 좌표/영어지원 여부를 그대로 상속받음. |
| 문의 vs 예약 | 템플스테이 예약은 승인 절차 없이 선착순으로 바로 확정되는 정책이라 `TEMPLE_STAY_RESERVATION`에 "문의" 단계가 없음. 일반 문의(1:1 Q&A)는 완전히 별도인 `INQUIRY` 테이블로 분리. |
| 예약-참가자-결제 분리 | 예약 1건에 참가자가 여러 명일 수 있어 `RESERVATION_PARTICIPANT`로 분리(1:N). 결제는 예약 1건당 1건이라 `PAYMENT`로 분리(1:1). |
| 사찰 등록 | 사찰 관계자가 회원가입 없이 신청하는 `TEMPLE_REGISTRATION_REQUEST`를 따로 두고, 관리자가 승인하면 이 행이 승격되는 게 아니라 완전히 새로운 `TEMPLE` 행을 생성함. |
| 회원 탈퇴 처리 | `status`/`withdrawn_at` 컬럼을 두지 않고, 탈퇴 시 회원 행을 실제로 `DELETE`함(소프트 삭제 아님). |

---

## 2. 전체 테이블 목록

| 번호 | 테이블명 | 설명 |
|---|---|---|
| 1 | USER | 일반 회원 계정(로컬/카카오 로그인 공통) |
| 2 | TEMPLE | 사찰 정보 + 사찰 관리자 계정 |
| 3 | TEMPLE_STAY_PROGRAM | 사찰이 운영하는 템플스테이 프로그램(상품) |
| 4 | TEMPLE_STAY_RESERVATION | 템플스테이 예약 |
| 5 | RESERVATION_PARTICIPANT | 예약 1건당 참가자 인적사항(1:N) |
| 6 | PAYMENT | 예약 결제(1:1) |
| 7 | TEMPLE_STAY_REVIEW | 템플스테이 리뷰 |
| 8 | FAVORITE_REVIEW | 좋아요한 리뷰 |
| 9 | FAVORITE_TEMPLE | 관심 사찰 |
| 10 | TEMPLE_EVENT | 사찰 행사 |
| 11 | FAVORITE_EVENT | 관심 행사 |
| 12 | DAILY_QUOTE | 오늘의 불교 한마디 |
| 13 | FAVORITE_QUOTE | 저장한 한마디 |
| 14 | TEMPLE_FOOD_RECOMMENDATION | 사찰음식 추천 |
| 15 | FAVORITE_FOOD | 관심 사찰음식 |
| 16 | TEMPLE_REGISTRATION_REQUEST | 사찰 등록 요청(관리자 승인 대기열) |
| 17 | INQUIRY | 회원 1:1 문의 |

> ERD 다이어그램은 [`buddhist-site-erd.svg`](./buddhist-site-erd.svg)를 참고하세요.
>
> 예전엔 여기에 불교 용어/예절가이드/불교란? 내용을 담는 `BUDDHISM_INFO` 테이블도 있었으나,
> 세 화면 다 처음부터 이 테이블을 안 읽고 완전히 정적으로 동작해서(위 "주요 설계 결정" 참고)
> 2026-09-15 테이블째로 삭제했습니다.

---

## 3. 테이블별 상세 명세

### 3-1. USER (회원)

**설명**: 일반 회원 계정. 카카오 로그인 회원은 `password`가 NULL입니다. 로그인 아이디는 변경 불가하며 `@`로 시작할 수 없습니다(사찰 계정과 구분).

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| login_id | VARCHAR(30) | PK | 로그인 아이디 (변경 불가, `@` 시작 불가) |
| password | VARCHAR(255) | NULL 허용 | 비밀번호(카카오 회원은 NULL) |
| nickname | VARCHAR(30) | NOT NULL, UNIQUE | 법명(마이페이지에서 본인/관리자 수정 가능) |
| name | VARCHAR(150) | NOT NULL | 실명(여권 영문 이름 형식) |
| phone | VARCHAR(20) | NULL 허용 | 연락처 |
| email | VARCHAR(100) | UNIQUE, NULL 허용 | 이메일(일반 회원은 필수, 사이트 관리자는 예외) |
| role | ENUM('USER','ADMIN') | NOT NULL, DEFAULT 'USER' | 일반/사이트 관리자 구분 |
| login_type | ENUM('LOCAL','KAKAO') | NOT NULL, DEFAULT 'LOCAL' | 가입 경로 |

---

### 3-2. TEMPLE (사찰)

**설명**: 사찰 정보 + 사찰 관리자 로그인 계정을 함께 담습니다. `login_id`는 `@`로 시작하도록 CHECK 제약이 걸려있어 USER와 구분됩니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| temple_id | BIGINT | PK, AUTO_INCREMENT | 사찰 고유 번호 |
| name | VARCHAR(100) | NOT NULL | 사찰 이름 |
| image_url | VARCHAR(255) | NULL 허용 | 대표 이미지 경로 |
| latitude / longitude | DECIMAL(10,7) | NOT NULL | 위도/경도 |
| address | VARCHAR(255) | NOT NULL | 주소 |
| region | VARCHAR(20) | NOT NULL | 지역(시/도) 필터 |
| support_sea / support_mountain / support_river / support_urban | BOOLEAN | DEFAULT FALSE | 장소 유형(중복 가능해서 컬럼 4개로 분리) |
| support_english | BOOLEAN | DEFAULT FALSE | 영어 지원 여부 |
| is_temple | BOOLEAN | DEFAULT TRUE | 실제 사찰 건물 여부 |
| special_notice | TEXT | NULL 허용 | 사찰별 유의사항(프로그램 상세에도 그대로 노출) |
| refund_policy | TEXT | NULL 허용 | 환불 규정(사찰 공통) |
| login_id | VARCHAR(30) | UNIQUE, `@` 시작 | 사찰 관리자 로그인 아이디 |
| password | VARCHAR(255) | NOT NULL | 관리자 비밀번호(암호화) |
| must_change_password | BOOLEAN | DEFAULT FALSE | 임시 비밀번호 발급 시 TRUE — 로그인 시 변경 페이지로 강제 이동 |

---

### 3-3. TEMPLE_STAY_PROGRAM (템플스테이 프로그램)

**설명**: 각 사찰이 운영하는 프로그램(상품). `support_english`/`latitude`/`longitude`는 트리거(`trg_program_inherit_before_insert`/`_before_update`)가 저장 시점마다 소속 사찰의 현재 값으로 덮어씁니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| program_id | BIGINT | PK, AUTO_INCREMENT | 프로그램 고유 번호 |
| temple_id | BIGINT | FK → TEMPLE | 운영 사찰 |
| title | VARCHAR(100) | NOT NULL | 프로그램명 |
| program_type | ENUM('당일형','체험형','휴식형') | NOT NULL | 유형(당일형=당일, 체험형/휴식형=1박2일 고정 규칙) |
| image_url | VARCHAR(255) | NOT NULL | 대표 이미지 |
| description / schedule / required_items | TEXT | NULL 허용 | 소개 / 일정표 / 준비물 |
| price | INT | NOT NULL | 1인 참가 비용(원) |
| duration | VARCHAR(20) | NOT NULL | 진행 기간 표기(예: "1박 2일") |
| open_start_date / open_end_date | DATE | NOT NULL | 모집(운영) 기간 |
| max_participant | INT | DEFAULT 20 | 최대 인원(전 프로그램 공통 20명 고정, CHECK 제약) |
| support_english / latitude / longitude | - | 트리거로 소속 TEMPLE 값 상속 | 관리자가 입력해도 저장 시점에 덮어써짐 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

환불 규정/유의사항 컬럼은 없습니다 — 사찰 공통이라 `TEMPLE.refund_policy`/`TEMPLE.special_notice`를 조인해서 그대로 보여줍니다(항상 최신값 유지, 프로그램마다 복사 저장 안 함).

---

### 3-4. TEMPLE_STAY_RESERVATION (예약)

**설명**: 사찰 관리자 승인 절차 없이 선착순으로 바로 확정되는 정책이라 "예약대기" 상태가 없습니다. `start_date`/`end_date`는 신청 시점에 계산해서 둘 다 명시적으로 저장합니다(월말 경계 계산 실수를 막기 위해 조회 시마다 재계산하지 않음).

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| reservation_id | BIGINT | PK, AUTO_INCREMENT | 예약 고유 번호 |
| login_id | VARCHAR(30) | FK → USER | 신청 회원 |
| program_id | BIGINT | FK → TEMPLE_STAY_PROGRAM | 대상 프로그램 |
| start_date / end_date | DATE | NOT NULL | 이용 시작일/종료일 |
| participant_count | INT | NOT NULL | 신청 인원 |
| note | TEXT | NULL 허용 | 전달사항 |
| status | ENUM('예약확정','취소','이용완료') | DEFAULT '예약확정' | 진행 상태 |
| canceled_at | DATETIME | NULL 허용 | 취소일시 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 신청일시 |

---

### 3-5. RESERVATION_PARTICIPANT (예약 참가자)

**설명**: 예약 1건에 참가자가 여러 명일 수 있어 별도 테이블로 분리(1:N). 대표자만 연락처를 입력받고 나머지 참가자는 `phone`이 NULL입니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| participant_id | BIGINT | PK, AUTO_INCREMENT | 참가자 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, ON DELETE CASCADE | 소속 예약 |
| name | VARCHAR(50) | NOT NULL | 이름(여권 영문 이름 형식) |
| gender | ENUM('남성','여성') | NOT NULL | 성별 |
| email | VARCHAR(100) | NOT NULL | 이메일 |
| phone | VARCHAR(20) | NULL 허용 | 연락처(대표자만) |

---

### 3-6. PAYMENT (예약 결제)

**설명**: 예약 1건당 결제 1건(`UNIQUE`). 결제 방식에 따라 필수 컬럼이 갈립니다(CHECK 제약으로 강제).

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| payment_id | BIGINT | PK, AUTO_INCREMENT | 결제 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, UNIQUE | 결제 대상 예약 |
| payment_method | ENUM('계좌이체','카카오페이') | NOT NULL | 결제 방식 |
| amount | INT | NOT NULL | 결제 금액(원) |
| status | ENUM('대기','완료','취소','환불') | DEFAULT '대기' | 결제 상태 |
| depositor_name | VARCHAR(50) | 계좌이체 전용 | 입금자명 |
| kakao_tid | VARCHAR(100) | 카카오페이 전용 | 카카오페이 거래번호 |
| paid_at | DATETIME | NULL 허용 | 결제 완료 시각 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 결제 시도 등록일시 |

---

### 3-7. TEMPLE_STAY_REVIEW (리뷰)

**설명**: 예약 1건당 리뷰 1개(`UNIQUE`). 첨부 이미지는 JSON 배열로 저장합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| review_id | BIGINT | PK, AUTO_INCREMENT | 리뷰 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION, UNIQUE | 대상 예약 |
| login_id | VARCHAR(30) | FK → USER | 작성 회원 |
| rating | TINYINT | CHECK 1~5 | 평점 |
| content | TEXT | NOT NULL | 리뷰 내용 |
| image_urls | JSON | NULL 허용 | 첨부 이미지 목록 |
| like_count | INT | DEFAULT 0 | 추천 수(캐시값) |
| view_count | INT | DEFAULT 0 | 조회수 |
| created_at / updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 작성/수정일시 |

---

### 3-8. FAVORITE_REVIEW (좋아요한 리뷰)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_review_id | BIGINT | PK, AUTO_INCREMENT | 좋아요 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 좋아요한 회원 |
| review_id | BIGINT | FK → TEMPLE_STAY_REVIEW, ON DELETE CASCADE | 대상 리뷰 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

`(login_id, review_id)` UNIQUE로 중복 좋아요를 막습니다.

---

### 3-9. FAVORITE_TEMPLE (관심 사찰)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 회원 |
| temple_id | BIGINT | FK → TEMPLE, ON DELETE CASCADE | 사찰 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

`(login_id, temple_id)` UNIQUE.

---

### 3-10. TEMPLE_EVENT (사찰 행사)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| event_id | BIGINT | PK, AUTO_INCREMENT | 행사 고유 번호 |
| temple_id | BIGINT | FK → TEMPLE | 주최 사찰 |
| title | VARCHAR(150) | NOT NULL | 행사명 |
| description | TEXT | NULL 허용 | 행사 소개 |
| start_date / end_date | DATE | NOT NULL | 행사 기간 |
| link_url | VARCHAR(255) | NULL 허용 | 공식 페이지/기사 링크 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

홈 화면 "월간 불교 행사" 캘린더가 이 테이블만 읽습니다(템플스테이 프로그램 모집기간은 표시하지 않음 — 프로그램이 항상 500건 넘게 모집 중이라 캘린더가 꽉 차 보이는 문제로 뺐습니다).

---

### 3-11. FAVORITE_EVENT (관심 행사)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_event_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 회원 |
| event_id | BIGINT | FK → TEMPLE_EVENT, ON DELETE CASCADE | 행사 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

`(login_id, event_id)` UNIQUE.

---

### 3-12. DAILY_QUOTE (오늘의 불교 한마디)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| quote_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| content | TEXT | NOT NULL | 한마디 내용 |
| source | VARCHAR(100) | NULL 허용 | 출처 |

날짜 컬럼이 없어 매번 목록 전체를 받아와 그중 하나를 뽑아 보여주는 방식으로 씁니다.

---

### 3-13. FAVORITE_QUOTE (저장한 한마디)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_quote_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 회원 |
| quote_id | BIGINT | FK → DAILY_QUOTE, ON DELETE CASCADE | 한마디 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 저장일시 |

`(login_id, quote_id)` UNIQUE.

---

### 3-14. TEMPLE_FOOD_RECOMMENDATION (사찰음식 추천)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| recommendation_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| food_name | VARCHAR(50) | NOT NULL | 음식명 |
| description | TEXT | NULL 허용 | 소개 |
| recipe | TEXT | NULL 허용 | 조리 순서 |
| recipe_url | VARCHAR(255) | NULL 허용 | 레시피 참고 링크(만개의레시피 등) |
| image_url | VARCHAR(255) | NULL 허용 | 음식 사진 |

---

### 3-15. FAVORITE_FOOD (관심 사찰음식)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| favorite_food_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 회원 |
| recommendation_id | BIGINT | FK → TEMPLE_FOOD_RECOMMENDATION, ON DELETE CASCADE | 음식 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |

`(login_id, recommendation_id)` UNIQUE.

---

### 3-16. TEMPLE_REGISTRATION_REQUEST (사찰 등록 요청)

**설명**: 사찰 관계자가 회원가입 없이 홈 화면 "문의하기"로 제출하는 요청입니다. `TEMPLE`과 완전히 분리되어 있고, 승인해도 이 행이 승격되지 않습니다 — 관리자가 승인하면 별도의 새 `TEMPLE` 행을 생성합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| request_id | BIGINT | PK, AUTO_INCREMENT | 요청 고유 번호 |
| name / image_url / latitude / longitude / address / region | - | TEMPLE과 동일 | 사찰 기본 정보 |
| support_sea / support_mountain / support_river / support_urban / support_english | BOOLEAN | DEFAULT FALSE | 장소 유형/영어 지원 |
| special_notice / refund_policy | TEXT | NULL 허용 | 유의사항/환불 규정 |
| contact_email | VARCHAR(100) | NOT NULL | 요청자 연락 이메일(승인 시 계정정보 발송 대상, TEMPLE엔 저장 안 됨) |
| status | ENUM('대기','승인') | DEFAULT '대기' | 처리 상태 |
| approved_temple_id | BIGINT | FK → TEMPLE, NULL 허용 | 승인 후 생성된 TEMPLE 행 추적용 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 요청 등록일시 |

`login_id`/`password`/`is_temple`은 승인 시점에 시스템이 생성하는 값이라 이 테이블에는 없습니다.

---

### 3-17. INQUIRY (1:1 문의)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|---|---|---|---|
| inquiry_id | BIGINT | PK, AUTO_INCREMENT | 고유 번호 |
| login_id | VARCHAR(30) | FK → USER, ON DELETE CASCADE | 작성 회원 |
| title | VARCHAR(100) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 문의 내용 |
| answer | TEXT | NULL 허용 | 관리자 답변 |
| status | ENUM('대기','답변완료') | DEFAULT '대기' | 처리 상태 |
| created_at / answered_at | DATETIME | - | 작성/답변일시 |

---

## 4. 테이블 간 관계(FK) 요약

| 부모 테이블 | 자식 테이블 | 관계 | 설명 |
|---|---|---|---|
| TEMPLE | TEMPLE_STAY_PROGRAM | 1:N | 한 사찰이 여러 프로그램을 운영 |
| TEMPLE_STAY_PROGRAM | TEMPLE_STAY_RESERVATION | 1:N | 한 프로그램에 여러 예약 |
| USER | TEMPLE_STAY_RESERVATION | 1:N | 한 회원이 여러 예약 신청 |
| TEMPLE_STAY_RESERVATION | RESERVATION_PARTICIPANT | 1:N | 예약 1건에 참가자 여러 명 |
| TEMPLE_STAY_RESERVATION | PAYMENT | 1:1 | 예약 1건당 결제 1건 |
| TEMPLE_STAY_RESERVATION | TEMPLE_STAY_REVIEW | 1:1 | 예약 1건당 리뷰 최대 1개 |
| USER | TEMPLE_STAY_REVIEW | 1:N | 한 회원이 여러 리뷰 작성 |
| USER, TEMPLE_STAY_REVIEW | FAVORITE_REVIEW | N:M (중간 테이블) | 리뷰 좋아요 |
| USER, TEMPLE | FAVORITE_TEMPLE | N:M (중간 테이블) | 관심 사찰 |
| TEMPLE | TEMPLE_EVENT | 1:N | 한 사찰이 여러 행사 주최 |
| USER, TEMPLE_EVENT | FAVORITE_EVENT | N:M (중간 테이블) | 관심 행사 |
| USER, DAILY_QUOTE | FAVORITE_QUOTE | N:M (중간 테이블) | 저장한 한마디 |
| USER, TEMPLE_FOOD_RECOMMENDATION | FAVORITE_FOOD | N:M (중간 테이블) | 관심 사찰음식 |
| TEMPLE_REGISTRATION_REQUEST | TEMPLE | 승인 시 생성(FK 아님, `approved_temple_id`로 추적) | 요청 승인 → 새 TEMPLE 행 생성 |
| USER | INQUIRY | 1:N | 한 회원이 여러 문의 작성 |

`DAILY_QUOTE`, `TEMPLE_FOOD_RECOMMENDATION`은 다른 테이블에서 FK로 참조만 받고, 자신은 아무것도 참조하지 않는 콘텐츠 테이블입니다.

---

## 5. 참고: 확장 시 고려할 수 있는 사항

- **회원 탈퇴 이력 보존이 필요해지면**: `status`/`withdrawn_at`을 다시 추가하거나, 탈퇴 회원 정보를 별도 로그 테이블에 옮겨 담는 방식을 고려할 수 있습니다.
- **COMMENT(댓글)**: 리뷰에 댓글 기능을 붙일 때 필요.
- **TEMPLE_FOOD_RECOMMENDATION.recipe_url**: 2026-09-10 정식 컬럼으로 추가되기 전엔 `recipe` 텍스트 마지막 줄에 `참고 레시피: <url>` 형식으로 임시 저장했었습니다. 지금은 `recipe_url`로 분리되어 있고, 시드는 [`05-temple-food-seed.sql`](../sql/05-temple-food-seed.sql)이 관리합니다.
