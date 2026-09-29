-- ============================================================
-- FAVORITE_REVIEW(좋아요한 리뷰) 테스트 데이터
--
-- 08~10번과 같은 방식으로, testuser1/testuser2가 TEMPLE_STAY_REVIEW(총
-- 20건) 중 일부를 무작위로 좋아요한 것처럼 넣는다. testuser1 기준
-- favoritesPagination.js의 한 페이지 분량(8건)을 넘겨서 번호 페이지네이션이
-- 2페이지 이상으로 나뉘는 걸 테스트할 수 있게 하려는 용도다.
--
-- 먼저 01(USER), 07(TEMPLE_STAY_REVIEW 10건), 12(TEMPLE_STAY_REVIEW 추가
-- 10건)를 실행한 뒤 이 스크립트를 실행하세요.
--
-- ⚠ 재실행 안내: testuser1/testuser2의 기존 FAVORITE_REVIEW만 지우고 다시
-- 무작위로 넣습니다(RAND() 기반이라 실행할 때마다 선택되는 리뷰가
-- 달라집니다).
-- ============================================================

DELETE FROM FAVORITE_REVIEW WHERE login_id IN ('testuser1', 'testuser2');

INSERT INTO FAVORITE_REVIEW (login_id, review_id)
SELECT 'testuser1', review_id FROM TEMPLE_STAY_REVIEW ORDER BY RAND() LIMIT 15;

INSERT INTO FAVORITE_REVIEW (login_id, review_id)
SELECT 'testuser2', review_id FROM TEMPLE_STAY_REVIEW ORDER BY RAND() LIMIT 6;
