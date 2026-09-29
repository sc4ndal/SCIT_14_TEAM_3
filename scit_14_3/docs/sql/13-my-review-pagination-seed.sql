-- =====================================================================
-- "내가 쓴 리뷰"(myReviews.html) 페이지네이션 테스트용 - testuser1이 직접
-- 작성한 리뷰를 3건 더 추가한다(07+12번 실행 후 testuser1 작성 리뷰가 7건이라
-- favoritesPagination.js의 한 페이지 분량(8건)을 안 넘어서 페이지 번호가 안
-- 뜬다 - 이 파일로 10건을 채워 2페이지로 나뉘는 걸 확인할 수 있게 한다).
--
-- 07/12번이 쓴 nth(2,6,7,13,14,20,21,27,28,34,35,41,42,48,49,55,56,62,63,
-- 69,70,77,84,91,98,105,112,119,126,133)와 안 겹치게 다른 nth를 썼다.
--
-- 실행 순서: 01(USER) → 03(TEMPLE_STAY_PROGRAM) → 07 → 12 → 이 파일.
--
-- ⚠ 재실행 안내: 실행할 때마다 '이용완료' 예약과 리뷰를 3건씩 더 추가한다
-- (07/12번과 동일한 방식 - 재실행 시 중복 방지를 안 함).
-- =====================================================================

INSERT INTO TEMPLE_STAY_RESERVATION
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at)
SELECT v.login_id, p.program_id, v.start_date, v.end_date, v.participant_count, v.note, v.status, v.canceled_at
FROM (
    SELECT 'testuser1' AS login_id, 4 AS nth, '2026-06-12' AS start_date, '2026-06-13' AS end_date, 1 AS participant_count, NULL AS note, '이용완료' AS status, NULL AS canceled_at
    UNION ALL SELECT 'testuser1', 11, '2026-07-08', '2026-07-09', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 18, '2026-08-25', '2026-08-26', 1, NULL, '이용완료', NULL
) v
JOIN (SELECT program_id, ROW_NUMBER() OVER (ORDER BY program_id) AS rn FROM TEMPLE_STAY_PROGRAM) p ON p.rn = v.nth;

INSERT INTO TEMPLE_STAY_REVIEW
    (reservation_id, login_id, rating, content, image_urls, like_count, view_count, created_at, updated_at)
SELECT reservation_id, login_id, rating, content, NULL, like_count, view_count, created_at, created_at
FROM (
    SELECT d.reservation_id,
           d.login_id,
           b.rating,
           b.content,
           b.like_count,
           b.view_count,
           DATE_ADD(d.end_date, INTERVAL b.days_after DAY) + INTERVAL b.hh HOUR AS created_at
    FROM (
        SELECT r.reservation_id, r.login_id, r.end_date,
               ROW_NUMBER() OVER (ORDER BY r.start_date, r.reservation_id) AS rn
        FROM TEMPLE_STAY_RESERVATION r
        WHERE r.status = '이용완료'
          AND r.login_id = 'testuser1'
          AND NOT EXISTS (SELECT 1 FROM TEMPLE_STAY_REVIEW v
                          WHERE v.reservation_id = r.reservation_id)
    ) d
    JOIN (
        SELECT 1 AS rn, 5 AS rating, 3 AS like_count, 40 AS view_count, 2 AS days_after, 9 AS hh,
               '평소 잠을 잘 못 자는 편인데 여기서는 웬일인지 푹 잤습니다. 방이 조용하고 이부자리도 편했어요. 아침 산책 코스도 짧지 않게 잘 짜여 있었습니다.' AS content
        UNION ALL SELECT 2, 4, 2, 35, 3, 14,
               '단체 체험이라 조금 정신없긴 했지만, 다 같이 발우공양을 하는 경험이 특별했습니다. 다음엔 개인으로 조용히 와보고 싶어요.'
        UNION ALL SELECT 3, 5, 5, 52, 1, 12,
               '두 번째로 방문한 곳인데 스태프분들이 저를 기억해주셔서 놀랐습니다. 프로그램 구성도 지난번보다 다양해져서 좋았어요.'
    ) b ON b.rn = d.rn
) x;
