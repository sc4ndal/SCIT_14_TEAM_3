-- ============================================================
-- FAVORITE_EVENT(관심 행사) 테스트 데이터
--
-- testuser1이 TEMPLE_EVENT(총 43건) 중 30건을, testuser2가 12건을 무작위로
-- 즐겨찾기한 것처럼 시드 데이터를 넣습니다. testuser1 기준 관심 행사 목록이
-- 25건 이상이 되어 목록/페이지네이션 화면을 테스트할 수 있게 하려는 용도입니다.
--
-- 먼저 01(USER), 04(TEMPLE_EVENT)를 실행한 뒤 이 스크립트를 실행하세요.
--
-- ⚠ 재실행 안내: testuser1/testuser2의 기존 FAVORITE_EVENT만 지우고 다시
-- 무작위로 넣습니다(RAND() 기반이라 실행할 때마다 선택되는 행사가 달라집니다).
-- ============================================================

DELETE FROM FAVORITE_EVENT WHERE login_id IN ('testuser1', 'testuser2');

INSERT INTO FAVORITE_EVENT (login_id, event_id)
SELECT 'testuser1', event_id FROM TEMPLE_EVENT ORDER BY RAND() LIMIT 30;

INSERT INTO FAVORITE_EVENT (login_id, event_id)
SELECT 'testuser2', event_id FROM TEMPLE_EVENT ORDER BY RAND() LIMIT 12;
