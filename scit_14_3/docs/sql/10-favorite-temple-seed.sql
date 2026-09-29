-- ============================================================
-- FAVORITE_TEMPLE(관심 사찰) 테스트 데이터
--
-- 08/09번과 같은 방식으로, testuser1/testuser2가 TEMPLE(총 171곳) 중
-- 일부를 무작위로 즐겨찾기한 것처럼 넣는다. testuser1 기준 12건(한 페이지
-- 분량)을 넘겨서 무한 스크롤 로딩을 테스트할 수 있게 하려는 용도다.
--
-- 먼저 01(USER, TEMPLE)을 실행한 뒤 이 스크립트를 실행하세요.
--
-- ⚠ 재실행 안내: testuser1/testuser2의 기존 FAVORITE_TEMPLE만 지우고 다시
-- 무작위로 넣습니다(RAND() 기반이라 실행할 때마다 선택되는 사찰이
-- 달라집니다).
-- ============================================================

DELETE FROM FAVORITE_TEMPLE WHERE login_id IN ('testuser1', 'testuser2');

INSERT INTO FAVORITE_TEMPLE (login_id, temple_id)
SELECT 'testuser1', temple_id FROM TEMPLE ORDER BY RAND() LIMIT 25;

INSERT INTO FAVORITE_TEMPLE (login_id, temple_id)
SELECT 'testuser2', temple_id FROM TEMPLE ORDER BY RAND() LIMIT 10;
