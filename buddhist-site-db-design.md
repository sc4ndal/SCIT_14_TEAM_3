# 불교 종합 사이트 DB 설계 문서

## 1. 문서 개요

이 문서는 불교 종합 사이트 팀 프로젝트에서 사용할 데이터베이스 구조를 정리한 문서입니다.
아래 3가지 기능을 기준으로 테이블을 설계했습니다.

1. 커뮤니티 기능 (불교 설명, 템플스테이 문의/예약/리뷰, 목탁 두드리기, 불교 한마디·음식 추천)
2. 지도 (API 기반 사찰 검색)
3. 회원정보관리 (회원가입, 정보 수정/탈퇴)

실제 DB 생성용 DDL(CREATE TABLE) 스크립트는 `buddhist-site-schema.sql` 파일에 있습니다.

### 주요 설계 결정

| 항목 | 결정 내용 |
|---|---|
| 관리자/일반 회원 구분 | `user.role` 컬럼(`ENUM('USER','ADMIN')`)으로 구분. 로그인 후 이 값으로 관리자 권한 여부를 판단합니다. |
| 목탁 개인 카운트 초기화 | `user.moktak_count`(오늘 친 횟수) + `user.moktak_count_date`(기준 날짜)를 함께 저장. 목탁을 두드릴 때 `moktak_count_date`가 오늘과 다르면 애플리케이션에서 `moktak_count`를 0으로 초기화한 뒤 1을 더합니다(지연 초기화 방식, 별도 배치/스케줄러 불필요). |
| 목탁 전체 카운트 | `moktak` 테이블에 `total_count` 컬럼으로 관리. 사이트 전체에서 딱 1개의 행만 사용하며, 두드릴 때마다 +1 됩니다. |
| 사찰 정보 | 주소·좌표·설명 등 상세 정보는 지도 API에서 그때그때 조회하고, DB에는 템플스테이 프로그램과 연결하기 위한 최소 정보(이름, API 장소 ID)만 저장합니다. |
| 문의 + 예약 통합 | `temple_stay_inquiry`와 `temple_stay_reservation`을 `temple_stay_reservation` 하나로 합쳤습니다. `status` 값으로 문의부터 예약 완료까지의 흐름을 관리합니다. |
| 회원 탈퇴 처리 | `status`/`withdrawn_at` 컬럼을 두지 않았으므로, 탈퇴 시 소프트 삭제가 아니라 회원 행을 실제로 `DELETE` 하는 방식으로 구현해야 합니다. |

---

## 2. 전체 테이블 목록

| 번호 | 테이블명(영문) | 테이블명(한글) | 설명 / 기능 | 관련 기능 |
|---|---|---|---|---|
| 1 | USER | 회원 | 회원 계정 정보 및 개인 목탁 카운트 저장 | 3.1, 3.2, 1.4 |
| 2 | TEMPLE | 사찰 | 템플스테이 프로그램 연결용 사찰 최소 정보(상세는 API 연동) | 1.2, 2.1, 2.2 |
| 3 | TEMPLE_STAY_PROGRAM | 템플스테이 프로그램 | 각 사찰이 운영하는 템플스테이 상품(코스) 정보 | 1.2 |
| 4 | TEMPLE_STAY_RESERVATION | 템플스테이 문의+예약 | 문의부터 예약, 취소, 이용완료까지의 흐름을 통합 관리 | 1.2, 3.3 |
| 5 | TEMPLE_STAY_REVIEW | 템플스테이 리뷰 | 후기·평점·첨부 이미지·추천수 저장 | 1.3 |
| 6 | BUDDHISM_INFO | 불교 정보 게시글 | 관리자가 작성하는 불교 교리·용어·역사 설명 게시글 | 1.1 |
| 7 | MOKTAK | 목탁 | 사이트 전체 목탁 타격 누적 카운트(단일 행) | 1.4 |
| 8 | DAILY_QUOTE | 불교 한마디 | 불교 명언/경전 문구 저장 | 1.5 |
| 9 | TEMPLE_FOOD_RECOMMENDATION | 사찰음식 추천 | 사찰음식 정보 저장 | 1.5 |
| 10 | FAVORITE_TEMPLE | 관심 사찰 즐겨찾기 | 회원이 즐겨찾기한 사찰 목록 저장 | 2.2 |

> ERD 다이어그램은 별도 파일(`buddhist-site-erd.mermaid`)에 있습니다.

---

## 3. 테이블별 상세 명세

### 3-1. USER (회원)

**설명**: 회원 계정 정보와 오늘 하루 동안의 개인 목탁 타격 횟수를 함께 관리합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| user_id | BIGINT | PK, AUTO_INCREMENT | 회원을 구분하는 고유 번호 |
| email | VARCHAR(100) | NOT NULL, UNIQUE | 로그인에 사용하는 이메일 주소 |
| password | VARCHAR(255) | NOT NULL | 암호화되어 저장되는 비밀번호 |
| nickname | VARCHAR(30) | NOT NULL, UNIQUE | 커뮤니티에서 표시되는 별명 |
| phone | VARCHAR(20) | NULL 허용 | 연락처 (선택 입력) |
| role | ENUM('USER','ADMIN') | NOT NULL, DEFAULT 'USER' | 일반 회원인지 관리자인지 구분 |
| moktak_count | INT | NOT NULL, DEFAULT 0 | 오늘 목탁을 친 횟수 (매일 초기화) |
| moktak_count_date | DATE | NULL 허용 | moktak_count의 기준 날짜. 오늘 날짜와 다르면 0으로 취급/초기화 |

---

### 3-2. TEMPLE (사찰)

**설명**: 템플스테이 프로그램을 연결하기 위한 최소 정보만 저장합니다. 주소·좌표·설명 등은 지도 API에서 `api_place_id`로 조회합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| temple_id | BIGINT | PK, AUTO_INCREMENT | 사찰을 구분하는 자체 DB 고유 번호 |
| name | VARCHAR(100) | NOT NULL | 사찰 이름 (목록/상세 표시용) |
| api_place_id | VARCHAR(100) | NOT NULL, UNIQUE | 지도 API의 장소 고유 ID |

---

### 3-3. TEMPLE_STAY_PROGRAM (템플스테이 프로그램)

**설명**: 각 사찰이 운영하는 템플스테이 상품(코스) 정보입니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| program_id | BIGINT | PK, AUTO_INCREMENT | 프로그램을 구분하는 고유 번호 |
| temple_id | BIGINT | FK → TEMPLE.temple_id, NOT NULL | 이 프로그램을 운영하는 사찰 |
| title | VARCHAR(100) | NOT NULL | 프로그램 이름 |
| description | TEXT | NULL 허용 | 프로그램 상세 설명 |
| price | INT | NOT NULL | 1인 기준 참가 비용 (원) |
| duration | VARCHAR(20) | NOT NULL | 진행 기간 (예: "1박2일") |
| max_participant | INT | NOT NULL | 회차당 최대 신청 가능 인원 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 등록일시 |

---

### 3-4. TEMPLE_STAY_RESERVATION (템플스테이 문의+예약)

**설명**: 기존 문의 테이블과 예약 테이블을 하나로 합쳤습니다. `status`로 진행 단계를 관리하며, 문의 단계에서는 날짜·인원이 비어있을 수 있습니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| reservation_id | BIGINT | PK, AUTO_INCREMENT | 문의/예약을 구분하는 고유 번호 |
| user_id | BIGINT | FK → USER.user_id, NOT NULL | 신청한 회원 |
| program_id | BIGINT | FK → TEMPLE_STAY_PROGRAM.program_id, NOT NULL | 대상 프로그램 |
| start_date | DATE | NULL 허용 | 이용 시작일 (문의 단계에서는 비어있을 수 있음) |
| end_date | DATE | NULL 허용 | 이용 종료일 |
| participant_count | INT | NULL 허용 | 신청 인원 수 |
| content | TEXT | NOT NULL | 문의/요청 내용 |
| answer | TEXT | NULL 허용 | 관리자 답변 |
| status | ENUM('문의','답변완료','예약확정','취소','이용완료') | NOT NULL, DEFAULT '문의' | 진행 상태 |
| canceled_at | DATETIME | NULL 허용 | 취소 처리일시 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 최초 신청일시 |

---

### 3-5. TEMPLE_STAY_REVIEW (템플스테이 리뷰)

**설명**: 예약을 완료한 회원이 남기는 후기입니다. 첨부 이미지는 `image_urls`(JSON 배열)에 함께 저장하고, 추천 수는 `like_count`로 관리합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| review_id | BIGINT | PK, AUTO_INCREMENT | 리뷰를 구분하는 고유 번호 |
| reservation_id | BIGINT | FK → TEMPLE_STAY_RESERVATION.reservation_id, NOT NULL, UNIQUE | 리뷰의 근거가 되는 예약 (1예약 = 1리뷰) |
| user_id | BIGINT | FK → USER.user_id, NOT NULL | 리뷰 작성자 |
| rating | TINYINT | NOT NULL (1~5 범위) | 평점 (별점 1~5) |
| content | TEXT | NOT NULL | 리뷰 본문 |
| image_urls | JSON | NULL 허용 | 첨부 이미지 경로 목록 (예: `["url1","url2"]`) |
| like_count | INT | NOT NULL, DEFAULT 0 | 리뷰 추천 수 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 리뷰 작성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 리뷰 수정일시 |

---

### 3-6. BUDDHISM_INFO (불교 정보 게시글)

**설명**: 관리자만 작성하는 게시글이라 작성자 식별 컬럼은 두지 않았습니다.
`category`에는 '용어', '예절가이드' 같은 **대분류만** 저장합니다. "불교 용어" 페이지 안에서 쓰는 8개 소분류(기본교리/수행법/경계·상태/인물/장소/의식/신앙/경전)는 DB 컬럼으로 두지 않고, 용어 개수가 고정적이라 애플리케이션(`TermCategory`)에서 제목 기준 정적 매핑으로 그룹핑합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| post_id | BIGINT | PK, AUTO_INCREMENT | 게시글을 구분하는 고유 번호 |
| category | VARCHAR(30) | NOT NULL, DEFAULT '용어' | 대분류. '용어', '예절가이드' 등 |
| title | VARCHAR(150) | NOT NULL | 게시글 제목 |
| content | TEXT | NOT NULL | 게시글 본문 |
| view_count | INT | NOT NULL, DEFAULT 0 | 조회수 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 작성일시 |

---

### 3-7. MOKTAK (목탁)

**설명**: 실시간 방송이 아니라, 사이트 전체에서 딱 1개의 행만 사용하는 전체 누적 타격 카운터입니다. 개인별 카운트는 USER.moktak_count에서 관리합니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| moktak_id | BIGINT | PK, AUTO_INCREMENT | 목탁 고유 번호 (전체 1행만 사용) |
| total_count | BIGINT | NOT NULL, DEFAULT 0 | 전체 목탁을 친 횟수 (누적, 리셋 없음) |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 마지막으로 두드린 시각 |

---

### 3-8. DAILY_QUOTE (불교 한마디)

**설명**: 불교 명언/경전 문구입니다. 날짜 컬럼이 없으므로, 특정 날짜에 고정 노출하는 대신 매번 하나를 무작위로 뽑아 보여주는 방식으로 사용하시면 됩니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| quote_id | BIGINT | PK, AUTO_INCREMENT | 한마디 데이터를 구분하는 고유 번호 |
| content | TEXT | NOT NULL | 한마디 내용 |
| source | VARCHAR(100) | NULL 허용 | 출처 (경전명, 스님 성함 등) |

---

### 3-9. TEMPLE_FOOD_RECOMMENDATION (사찰음식 추천)

**설명**: 사찰음식 정보입니다. 날짜 컬럼이 없으므로, DAILY_QUOTE와 마찬가지로 무작위 추천 방식으로 사용하시면 됩니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| recommendation_id | BIGINT | PK, AUTO_INCREMENT | 추천 데이터를 구분하는 고유 번호 |
| food_name | VARCHAR(50) | NOT NULL | 음식 이름 |
| description | TEXT | NULL 허용 | 음식 소개 |
| recipe | TEXT | NULL 허용 | 간단한 레시피 |
| image_url | VARCHAR(255) | NULL 허용 | 음식 사진 경로 |

---

### 3-10. FAVORITE_TEMPLE (관심 사찰 즐겨찾기)

**설명**: 회원이 관심 있는 사찰을 즐겨찾기할 때 사용합니다. 같은 회원이 같은 사찰을 중복으로 즐겨찾기하지 못하도록 (user_id, temple_id) 조합에 UNIQUE를 걸었습니다.

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 (기능/뜻) |
|---|---|---|---|
| favorite_id | BIGINT | PK, AUTO_INCREMENT | 즐겨찾기를 구분하는 고유 번호 |
| user_id | BIGINT | FK → USER.user_id, NOT NULL | 즐겨찾기한 회원 |
| temple_id | BIGINT | FK → TEMPLE.temple_id, NOT NULL | 즐겨찾기 대상 사찰 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 즐겨찾기 등록일시 |

> user_id + temple_id 조합은 UNIQUE 제약을 가지며, 회원이나 사찰이 삭제되면 관련 즐겨찾기도 함께 삭제됩니다(ON DELETE CASCADE).

---

## 4. 테이블 간 관계(FK) 요약

| 부모 테이블 | 자식 테이블 | 관계 | 설명 |
|---|---|---|---|
| USER | TEMPLE_STAY_RESERVATION | 1:N | 한 회원이 여러 건의 문의/예약을 남길 수 있음 |
| USER | TEMPLE_STAY_REVIEW | 1:N | 한 회원이 여러 개의 리뷰를 작성할 수 있음 |
| TEMPLE | TEMPLE_STAY_PROGRAM | 1:N | 한 사찰이 여러 템플스테이 프로그램을 운영할 수 있음 |
| TEMPLE_STAY_PROGRAM | TEMPLE_STAY_RESERVATION | 1:N | 한 프로그램에 여러 문의/예약이 있을 수 있음 |
| TEMPLE_STAY_RESERVATION | TEMPLE_STAY_REVIEW | 1:1 | 예약 1건당 리뷰는 최대 1개까지만 작성 가능 |
| USER | FAVORITE_TEMPLE | 1:N | 한 회원이 여러 사찰을 즐겨찾기할 수 있음 |
| TEMPLE | FAVORITE_TEMPLE | 1:N | 한 사찰이 여러 회원에게 즐겨찾기될 수 있음 |

BUDDHISM_INFO, MOKTAK, DAILY_QUOTE, TEMPLE_FOOD_RECOMMENDATION 네 테이블은 다른 테이블과 직접 연결되지 않는 독립적인 콘텐츠 테이블입니다.

---

## 5. 참고: 확장 시 고려할 수 있는 사항

- **회원 탈퇴 이력 보존이 필요해지면**: 다시 `status`/`withdrawn_at`을 추가하거나, 탈퇴 회원 정보를 별도 로그 테이블에 옮겨 담는 방식을 고려할 수 있습니다.
- **목탁 개인 랭킹/역대 기록이 필요해지면**: 현재는 오늘 카운트만 남기므로, 날짜별 기록이 필요할 경우 `moktak_daily_log(user_id, log_date, count)` 같은 별도 로그 테이블을 추가하는 방향을 고려할 수 있습니다.
- **COMMENT (댓글)**: 리뷰나 게시글에 댓글 기능을 붙일 때 필요
