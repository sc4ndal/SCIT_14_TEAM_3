-- =====================================================================
-- 템플스테이 리뷰 추가 더미 10건 (07-temple-stay-seed-data.sql의 [2]/[3]과
-- 같은 방식 - '이용완료' 예약을 새로 만들고 그 예약에 리뷰를 하나씩 붙인다)
--
-- 07번이 만든 예약(nth 2/7/14/21/28/35/42/49/56/63/70/77/84/91/98/105/112/
-- 119/126/133)과 안 겹치게 다른 nth를 썼다. TEMPLE_STAY_PROGRAM이 400건
-- 있어야 한다(03-buddhist-site-program-data.sql).
--
-- 실행 순서: 01(USER) → 03(TEMPLE_STAY_PROGRAM) → 07(TEMPLE_STAY_RESERVATION/
-- REVIEW 기본 10건) → 이 파일.
--
-- ⚠ 재실행 안내: 이 스크립트는 실행할 때마다 '이용완료' 예약과 리뷰를 10건씩
-- 더 추가한다(07번과 마찬가지로 재실행 시 중복 방지를 안 함). 깨끗이 다시
-- 만들려면 07번 상단 주석의 안내대로 TEMPLE_STAY_REVIEW/RESERVATION을 비우고
-- 07번부터 다시 실행할 것.
-- =====================================================================


-- =====================================================================
-- [1] 템플스테이 예약 - 과거 일정 + '이용완료' 10건 추가
-- =====================================================================
INSERT INTO TEMPLE_STAY_RESERVATION
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at)
SELECT v.login_id, p.program_id, v.start_date, v.end_date, v.participant_count, v.note, v.status, v.canceled_at
FROM (
    SELECT 'testuser1' AS login_id, 6 AS nth, '2026-06-05' AS start_date, '2026-06-06' AS end_date, 2 AS participant_count, NULL AS note, '이용완료' AS status, NULL AS canceled_at
    UNION ALL SELECT 'testuser2', 13, '2026-06-20', '2026-06-21', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'admin', 20, '2026-07-05', '2026-07-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 27, '2026-07-15', '2026-07-16', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 34, '2026-07-25', '2026-07-26', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 41, '2026-08-05', '2026-08-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'admin', 48, '2026-08-12', '2026-08-13', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 55, '2026-08-18', '2026-08-19', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 62, '2026-09-01', '2026-09-02', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'admin', 69, '2026-09-10', '2026-09-11', 1, NULL, '이용완료', NULL
) v
JOIN (SELECT program_id, ROW_NUMBER() OVER (ORDER BY program_id) AS rn FROM TEMPLE_STAY_PROGRAM) p ON p.rn = v.nth;


-- =====================================================================
-- [2] 위 예약 10건에 리뷰 달기
--     (07번의 [3]과 동일하게 "아직 리뷰가 없는 이용완료 예약"을 일정이 이른
--     순으로 골라 매칭하므로, 위 [1]에서 새로 만든 예약 10건에 정확히 붙는다)
-- =====================================================================
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
          AND NOT EXISTS (SELECT 1 FROM TEMPLE_STAY_REVIEW v
                          WHERE v.reservation_id = r.reservation_id)
    ) d
    JOIN (
        SELECT 1 AS rn, 5 AS rating, 9 AS like_count, 96 AS view_count, 2 AS days_after, 11 AS hh,
               '새벽 도량석 소리에 잠이 깨는 게 처음엔 낯설었는데, 사흘째부터는 오히려 그 소리를 기다리게 됐습니다. 공양간 음식이 하나같이 정성스러웠고, 스님과의 차담에서 들은 이야기가 오래 남을 것 같아요.' AS content
        UNION ALL SELECT 2, 4, 5, 71, 1, 19,
               '처음 해보는 참선이라 다리가 많이 저렸지만, 지도해주신 분이 초보자 배려를 많이 해주셔서 끝까지 할 수 있었습니다. 저녁 숲길 산책이 특히 좋았어요.'
        UNION ALL SELECT 3, 3, 2, 58, 4, 8,
               '시설은 깨끗했는데 일정이 촉박하게 짜여 있어서 쉬는 느낌보다는 빠듯하다는 느낌이 컸습니다. 발우공양 설명이 자세해서 그 부분은 좋았어요.'
        UNION ALL SELECT 4, 5, 14, 132, 3, 16,
               '혼자 조용히 머리를 비우고 싶어서 갔는데 기대 이상이었습니다. 새벽 예불부터 저녁 좌선까지 동선이 편안하게 짜여 있었고, 무엇보다 공간이 조용해서 좋았어요.'
        UNION ALL SELECT 5, 4, 6, 84, 2, 20,
               '아이와 함께 갔는데 체험 위주 프로그램이라 지루해하지 않았습니다. 다만 방이 조금 좁아서 셋이 지내기엔 다소 불편했어요. 스님들은 아이한테 특히 친절하셨습니다.'
        UNION ALL SELECT 6, 5, 20, 175, 5, 9,
               '벌써 세 번째 방문인데 올 때마다 새롭습니다. 이번엔 다도 체험이 새로 생겨서 참여했는데, 차를 우리는 동안 아무 생각도 안 드는 그 시간이 참 좋았어요.'
        UNION ALL SELECT 7, 3, 1, 47, 6, 13,
               '경치와 공기는 정말 좋았는데, 안내 데스크 응대가 조금 무뚝뚝하게 느껴졌습니다. 프로그램 내용 자체는 알찼습니다.'
        UNION ALL SELECT 8, 4, 8, 103, 3, 21,
               '108배를 처음 해봤는데 생각보다 힘들어서 놀랐습니다. 그래도 끝나고 나서의 개운함은 말로 표현하기 어렵네요. 다음엔 계절 바꿔서 또 오고 싶습니다.'
        UNION ALL SELECT 9, 5, 17, 189, 2, 10,
               '가족 단위로 참여하기 좋은 프로그램이었습니다. 연등 만들기와 탁본 체험이 특히 반응이 좋았고, 사찰음식도 자극적이지 않아 아이들도 잘 먹었어요.'
        UNION ALL SELECT 10, 4, 4, 66, 1, 17,
               '혼자만의 시간이 필요해서 다녀왔습니다. 일정에 여백이 있어서 산책도 하고 책도 읽을 수 있었어요. 다만 온수 나오는 시간이 정해져 있어서 미리 확인하고 가시는 게 좋을 것 같습니다.'
    ) b ON b.rn = d.rn
) x;
