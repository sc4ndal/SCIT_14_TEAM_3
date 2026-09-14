-- =====================================================================
-- 템플스테이 더미 데이터 통합 시드 (예약 30건 + 리뷰 10건)
--
-- 실행 순서:
--   1) buddhist-site-schema.sql        (USER: admin / testuser1 / testuser2 포함)
--   2) buddhist-site-program-data.sql  (TEMPLE_STAY_PROGRAM)
--   3) 이 파일  (temple-stay-seed-data.sql)
--
-- 이 파일 하나만 실행하면 예약/리뷰 더미가 모두 채워진다.
-- 아래 [1]~[3] 블록은 반드시 이 순서대로 실행되어야 한다([3]이 [1]/[2] 결과에 의존).
--
-- 깨끗이 다시 만들려면 실행 전에 아래 두 줄로 비우고 시작할 것
-- (FAVORITE_REVIEW 는 CASCADE 로 함께 삭제됨):
--   DELETE FROM temple_stay_review;
--   DELETE FROM temple_stay_reservation;
-- =====================================================================


-- =====================================================================
-- [1] 템플스테이 예약 - 신규(예약확정/취소) 20건
--     2026-09 ~ 11월 향후 일정
-- =====================================================================
INSERT INTO temple_stay_reservation
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at) VALUES
    ('testuser1',   3, '2026-09-20', '2026-09-21', 2, '조용한 방으로 부탁드려요',           '예약확정', NULL),
    ('testuser2',   8, '2026-09-22', '2026-09-23', 1, NULL,                                 '예약확정', NULL),
    ('admin',      15, '2026-09-25', '2026-09-26', 3, NULL,                                 '예약확정', NULL),
    ('testuser1',  22, '2026-09-28', '2026-09-29', 1, '알레르기 있음(견과류)',              '예약확정', NULL),
    ('testuser2',  29, '2026-10-02', '2026-10-03', 2, NULL,                                 '예약확정', NULL),
    ('admin',      36, '2026-10-05', '2026-10-06', 1, NULL,                                 '취소',    '2026-09-15 10:00:00'),
    ('testuser1',  43, '2026-10-08', '2026-10-09', 4, '가족 단위 참가',                     '예약확정', NULL),
    ('testuser2',  50, '2026-10-11', '2026-10-12', 2, NULL,                                 '예약확정', NULL),
    ('admin',      57, '2026-10-15', '2026-10-16', 1, NULL,                                 '예약확정', NULL),
    ('testuser1',  64, '2026-10-18', '2026-10-19', 2, NULL,                                 '취소',    '2026-09-20 09:30:00'),
    ('testuser2',  71, '2026-10-22', '2026-10-23', 1, NULL,                                 '예약확정', NULL),
    ('admin',      78, '2026-10-25', '2026-10-26', 3, NULL,                                 '예약확정', NULL),
    ('testuser1',  85, '2026-10-29', '2026-10-30', 2, NULL,                                 '예약확정', NULL),
    ('testuser2',  92, '2026-11-02', '2026-11-03', 1, NULL,                                 '예약확정', NULL),
    ('admin',      99, '2026-11-05', '2026-11-06', 2, NULL,                                 '예약확정', NULL),
    ('testuser1', 106, '2026-11-09', '2026-11-10', 4, NULL,                                 '예약확정', NULL),
    ('testuser2', 113, '2026-11-12', '2026-11-13', 1, NULL,                                 '취소',    '2026-09-25 14:20:00'),
    ('admin',     120, '2026-11-16', '2026-11-17', 2, NULL,                                 '예약확정', NULL),
    ('testuser1', 127, '2026-11-19', '2026-11-20', 1, NULL,                                 '예약확정', NULL),
    ('testuser2', 134, '2026-11-23', '2026-11-24', 3, NULL,                                 '예약확정', NULL);


-- =====================================================================
-- [2] 템플스테이 예약 - 과거 일정 + '이용완료' 10건
--     ([1] 20건 중 10건을 과거 날짜로 복제. 후기 작성 테스트 등 재사용 목적)
-- =====================================================================
INSERT INTO temple_stay_reservation
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at) VALUES
    ('testuser1',   3, '2026-06-10', '2026-06-11', 2, NULL, '이용완료', NULL),
    ('testuser2',   8, '2026-06-15', '2026-06-16', 1, NULL, '이용완료', NULL),
    ('admin',      15, '2026-07-01', '2026-07-02', 3, NULL, '이용완료', NULL),
    ('testuser1',  22, '2026-07-10', '2026-07-11', 1, NULL, '이용완료', NULL),
    ('testuser2',  29, '2026-07-18', '2026-07-19', 2, NULL, '이용완료', NULL),
    ('testuser1',  43, '2026-08-01', '2026-08-02', 4, NULL, '이용완료', NULL),
    ('testuser2',  50, '2026-08-08', '2026-08-09', 2, NULL, '이용완료', NULL),
    ('admin',      57, '2026-08-15', '2026-08-16', 1, NULL, '이용완료', NULL),
    ('testuser2',  71, '2026-08-22', '2026-08-23', 1, NULL, '이용완료', NULL),
    ('admin',      78, '2026-08-29', '2026-08-30', 3, NULL, '이용완료', NULL);


-- =====================================================================
-- [3] 템플스테이 리뷰 10건
--
-- 리뷰는 '이용완료' 상태의 예약 1건당 1개만 달 수 있다(uq_review_reservation, chk_review_rating).
-- 예약 id를 하드코딩하지 않고, "아직 리뷰가 없는 '이용완료' 예약"을 start_date 순으로 최대 10건
-- 골라 매칭한다. 예약 시드의 auto_increment 값이 달라도, 기존 리뷰가 있어도 에러 없이 동작한다.
--
-- 주의: '이용완료' 예약이 10건보다 많은 DB(예: [1][2] 블록을 여러 번 실행)에서 이 파일을 반복 실행하면
--       리뷰가 안 달린 예약이 남아있는 만큼 매번 최대 10건씩 더 채워진다. 깨끗이 다시 만들려면
--       파일 상단 주석의 DELETE 두 줄로 비우고 시작할 것.
-- =====================================================================
INSERT INTO temple_stay_review
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
        -- 아직 리뷰가 없는 '이용완료' 예약을 일정이 이른 순으로 1..N 번호 매김
        SELECT r.reservation_id, r.login_id, r.end_date,
               ROW_NUMBER() OVER (ORDER BY r.start_date, r.reservation_id) AS rn
        FROM temple_stay_reservation r
        WHERE r.status = '이용완료'
          AND NOT EXISTS (SELECT 1 FROM temple_stay_review v
                          WHERE v.reservation_id = r.reservation_id)
    ) d
    JOIN (
        SELECT 1 AS rn, 5 AS rating, 12 AS like_count, 143 AS view_count, 3 AS days_after, 10 AS hh,
               '새벽 예불에 참여하려고 큰맘 먹고 갔는데 정말 잘한 선택이었어요. 스님 법문이 마음에 오래 남고, 발우공양은 생각보다 어렵지 않았습니다. 방이 따뜻하고 조용해서 오랜만에 푹 잤네요.' AS content
        UNION ALL SELECT 2, 4, 3, 88, 2, 15,
               '도심에서 멀지 않은데 들어서자마자 공기가 달랐습니다. 108배는 다리가 후들거렸지만 끝나고 나니 개운했어요. 다만 저녁 프로그램이 조금 일찍 끝나서 아쉬웠습니다.'
        UNION ALL SELECT 3, 5, 21, 210, 4, 9,
               '가족과 함께 다녀왔습니다. 아이도 스님과 차담하는 시간을 좋아했고, 연등 만들기 체험이 특히 인기가 많았어요. 사찰음식도 자극적이지 않고 정갈해서 좋았습니다.'
        UNION ALL SELECT 4, 3, 1, 64, 5, 18,
               '프로그램 자체는 무난했는데 인원이 많아서 다소 붐볐어요. 명상 시간이 짧게 느껴졌고 안내가 매끄럽지 않은 부분이 있었습니다. 그래도 경치는 정말 좋았습니다.'
        UNION ALL SELECT 5, 4, 7, 121, 3, 20,
               '혼자 조용히 쉬고 싶어서 휴식형으로 예약했는데 딱 맞았습니다. 산책로가 잘 되어 있어서 아침저녁으로 걸었어요. 온수가 가끔 약하게 나온 점만 빼면 만족합니다.'
        UNION ALL SELECT 6, 5, 15, 178, 2, 11,
               '차 명상 프로그램이 인상적이었습니다. 말없이 차 한 잔에 집중하는 시간이 이렇게 길게 느껴질 줄 몰랐어요. 다음엔 겨울에 다시 오고 싶습니다.'
        UNION ALL SELECT 7, 2, 0, 52, 6, 21,
               '기대가 컸던 만큼 아쉬움도 컸습니다. 안내받은 일정표와 실제 진행이 조금 달랐고, 방 난방이 잘 안 됐어요. 스님들은 친절하셨지만 전반적인 운영은 아쉬웠습니다.'
        UNION ALL SELECT 8, 4, 9, 134, 3, 8,
               '출근 전에 다녀온 1박 2일이었는데 짧아도 알찼습니다. 새벽 산행에서 본 운해가 아직도 눈에 선해요. 아침 공양 후 차담까지 하고 나니 머리가 맑아졌습니다.'
        UNION ALL SELECT 9, 5, 18, 199, 5, 14,
               '두 번째 방문입니다. 지난번보다 프로그램이 더 짜임새 있어졌어요. 필사 시간과 포행이 특히 좋았고, 스님 말씀이 요즘 고민과 맞닿아 있어서 위로가 됐습니다.'
        UNION ALL SELECT 10, 3, 4, 77, 4, 16,
               '위치가 좋고 시설은 깔끔합니다. 다만 주말이라 그런지 다른 단체와 겹쳐서 아주 조용한 분위기는 아니었어요. 발우공양 체험은 꼭 해보시길 추천합니다.'
    ) b ON b.rn = d.rn
) x;
