-- ============================================================
-- FAVORITE_QUOTE(저장한 한마디) / FAVORITE_FOOD(관심 사찰음식) 테스트 데이터
--
-- 08-favorite-event-seed.sql과 같은 방식으로, testuser1/testuser2가 각각
-- DAILY_QUOTE(총 30건)/TEMPLE_FOOD_RECOMMENDATION(총 20건) 중 일부를
-- 무작위로 즐겨찾기한 것처럼 넣는다. testuser1 기준 두 목록 모두 12건(한
-- 페이지 분량)을 넘겨서 무한 스크롤 로딩을 테스트할 수 있게 하려는 용도다.
--
-- 먼저 01(USER), 02(DAILY_QUOTE), 03(TEMPLE_FOOD_RECOMMENDATION)을 실행한
-- 뒤 이 스크립트를 실행하세요.
--
-- ⚠ 재실행 안내: testuser1/testuser2의 기존 FAVORITE_QUOTE/FAVORITE_FOOD만
-- 지우고 다시 무작위로 넣습니다(RAND() 기반이라 실행할 때마다 선택되는
-- 항목이 달라집니다).
-- ============================================================

DELETE FROM FAVORITE_QUOTE WHERE login_id IN ('testuser1', 'testuser2');
DELETE FROM FAVORITE_FOOD WHERE login_id IN ('testuser1', 'testuser2');

INSERT INTO FAVORITE_QUOTE (login_id, quote_id)
SELECT 'testuser1', quote_id FROM DAILY_QUOTE ORDER BY RAND() LIMIT 25;

INSERT INTO FAVORITE_QUOTE (login_id, quote_id)
SELECT 'testuser2', quote_id FROM DAILY_QUOTE ORDER BY RAND() LIMIT 10;

INSERT INTO FAVORITE_FOOD (login_id, recommendation_id)
SELECT 'testuser1', recommendation_id FROM TEMPLE_FOOD_RECOMMENDATION ORDER BY RAND() LIMIT 18;

INSERT INTO FAVORITE_FOOD (login_id, recommendation_id)
SELECT 'testuser2', recommendation_id FROM TEMPLE_FOOD_RECOMMENDATION ORDER BY RAND() LIMIT 8;
