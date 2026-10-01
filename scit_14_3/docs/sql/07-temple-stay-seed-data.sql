-- =====================================================================
-- 템플스테이 더미 데이터 통합 시드 (예약 93건 + 리뷰 73건)
-- 원래 07/12/13 세 파일로 나뉘어 있었는데("기본 시드"+"리뷰 추가 더미"+"페이지네이션
-- 테스트용") 파일이 너무 많아서 전부 이 파일 하나로 합쳤다.
--
-- 실행 순서:
--   1) 01-buddhist-site-schema.sql        (USER: admin / testuser1 / testuser2 포함)
--   2) 03-buddhist-site-program-data.sql  (TEMPLE_STAY_PROGRAM - 프로그램이 최소 400건 있어야 함)
--   3) 이 파일  (07-temple-stay-seed-data.sql)
--
-- 이 파일 하나만 실행하면 예약/리뷰 더미가 모두 채워진다.
-- 예약이 붙는 프로그램은 program_id 숫자가 아니라 "program_id 순서로 N번째 프로그램"으로 고른다(SELECT 안의 nth 컬럼).
-- 그래서 삭제로 program_id에 빈 번호가 있어도 항상 존재하는 프로그램에 붙는다.
-- 아래 [1]~[3] 블록은 반드시 이 순서대로 실행되어야 한다([3]이 [1]/[2] 결과에 의존).
--
-- 리뷰 내용(제목/본문)은 특정 사찰·프로그램과 실제로 연관된 게 아니라 범용 더미 텍스트다 -
-- "아직 리뷰가 없는 이용완료 예약을 날짜 이른 순으로" 매칭하는 방식이라 어떤 리뷰가 어떤
-- 사찰에 붙는지는 매번 달라질 수 있다(평점 테스트용으로는 문제 없음).
--
-- admin 계정은 리뷰를 못 쓰게 ReviewController가 막아뒀으므로(일반회원 전용) 이 파일의
-- '이용완료' 예약(리뷰용)은 전부 testuser1/testuser2로만 만든다. admin은 [1]의 예약확정/취소
-- 더미에만 등장한다(관리자 계정으로 예약 목록 화면 테스트용, 리뷰와는 무관).
--
-- 깨끗이 다시 만들려면 실행 전에 아래 두 줄로 비우고 시작할 것
-- (FAVORITE_REVIEW 는 CASCADE 로 함께 삭제됨):
--   DELETE FROM TEMPLE_STAY_REVIEW;
--   DELETE FROM TEMPLE_STAY_RESERVATION;
-- =====================================================================


-- =====================================================================
-- [1] 템플스테이 예약 - 신규(예약확정/취소) 20건
--     2026-09 ~ 11월 향후 일정
-- =====================================================================
INSERT INTO TEMPLE_STAY_RESERVATION
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at, program_title_snapshot, temple_name_snapshot)
SELECT v.login_id, p.program_id, v.start_date, v.end_date, v.participant_count, v.note, v.status, v.canceled_at, p.title, t.name
FROM (
    SELECT 'testuser1' AS login_id, 2 AS nth, '2026-09-20' AS start_date, '2026-09-21' AS end_date, 2 AS participant_count, '조용한 방으로 부탁드려요' AS note, '예약확정' AS status, NULL AS canceled_at
    UNION ALL SELECT 'testuser2', 7, '2026-09-22', '2026-09-23', 1, NULL, '예약확정', NULL
    UNION ALL SELECT 'admin', 14, '2026-09-25', '2026-09-26', 3, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser1', 21, '2026-09-28', '2026-09-29', 1, '알레르기 있음(견과류)', '예약확정', NULL
    UNION ALL SELECT 'testuser2', 28, '2026-10-02', '2026-10-03', 2, NULL, '예약확정', NULL
    UNION ALL SELECT 'admin', 35, '2026-10-05', '2026-10-06', 1, NULL, '취소', '2026-09-15 10:00:00'
    UNION ALL SELECT 'testuser1', 42, '2026-10-08', '2026-10-09', 4, '가족 단위 참가', '예약확정', NULL
    UNION ALL SELECT 'testuser2', 49, '2026-10-11', '2026-10-12', 2, NULL, '예약확정', NULL
    UNION ALL SELECT 'admin', 56, '2026-10-15', '2026-10-16', 1, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser1', 63, '2026-10-18', '2026-10-19', 2, NULL, '취소', '2026-09-20 09:30:00'
    UNION ALL SELECT 'testuser2', 70, '2026-10-22', '2026-10-23', 1, NULL, '예약확정', NULL
    UNION ALL SELECT 'admin', 77, '2026-10-25', '2026-10-26', 3, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser1', 84, '2026-10-29', '2026-10-30', 2, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser2', 91, '2026-11-02', '2026-11-03', 1, NULL, '예약확정', NULL
    UNION ALL SELECT 'admin', 98, '2026-11-05', '2026-11-06', 2, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser1', 105, '2026-11-09', '2026-11-10', 4, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser2', 112, '2026-11-12', '2026-11-13', 1, NULL, '취소', '2026-09-25 14:20:00'
    UNION ALL SELECT 'admin', 119, '2026-11-16', '2026-11-17', 2, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser1', 126, '2026-11-19', '2026-11-20', 1, NULL, '예약확정', NULL
    UNION ALL SELECT 'testuser2', 133, '2026-11-23', '2026-11-24', 3, NULL, '예약확정', NULL
) v
JOIN (SELECT program_id, title, temple_id, ROW_NUMBER() OVER (ORDER BY program_id) AS rn FROM TEMPLE_STAY_PROGRAM) p ON p.rn = v.nth
JOIN TEMPLE t ON t.temple_id = p.temple_id;


-- =====================================================================
-- [2] 템플스테이 예약 - 과거 일정 + '이용완료' 73건 (리뷰 달 대상)
--     전부 testuser1/testuser2 (admin은 리뷰 작성이 막혀있어서 제외)
-- =====================================================================
INSERT INTO TEMPLE_STAY_RESERVATION
    (login_id, program_id, start_date, end_date, participant_count, note, status, canceled_at, program_title_snapshot, temple_name_snapshot)
SELECT v.login_id, p.program_id, v.start_date, v.end_date, v.participant_count, v.note, v.status, v.canceled_at, p.title, t.name
FROM (
    SELECT 'testuser1' AS login_id, 2 AS nth, '2026-06-10' AS start_date, '2026-06-11' AS end_date, 2 AS participant_count, NULL AS note, '이용완료' AS status, NULL AS canceled_at
    UNION ALL SELECT 'testuser2', 7, '2026-06-15', '2026-06-16', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 14, '2026-07-01', '2026-07-02', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 21, '2026-07-10', '2026-07-11', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 28, '2026-07-18', '2026-07-19', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 42, '2026-08-01', '2026-08-02', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 49, '2026-08-08', '2026-08-09', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 56, '2026-08-15', '2026-08-16', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 70, '2026-08-22', '2026-08-23', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 77, '2026-08-29', '2026-08-30', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 6, '2026-06-05', '2026-06-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 13, '2026-06-20', '2026-06-21', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 20, '2026-07-05', '2026-07-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 27, '2026-07-15', '2026-07-16', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 34, '2026-07-25', '2026-07-26', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 41, '2026-08-05', '2026-08-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 48, '2026-08-12', '2026-08-13', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 55, '2026-08-18', '2026-08-19', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 62, '2026-09-01', '2026-09-02', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 69, '2026-09-10', '2026-09-11', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 200, '2026-04-01', '2026-04-02', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 203, '2026-04-03', '2026-04-04', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 206, '2026-04-05', '2026-04-06', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 209, '2026-04-07', '2026-04-08', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 212, '2026-04-09', '2026-04-10', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 215, '2026-04-11', '2026-04-12', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 218, '2026-04-13', '2026-04-14', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 221, '2026-04-15', '2026-04-16', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 224, '2026-04-17', '2026-04-18', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 227, '2026-04-19', '2026-04-20', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 230, '2026-04-21', '2026-04-22', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 233, '2026-04-23', '2026-04-24', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 236, '2026-04-25', '2026-04-26', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 239, '2026-04-27', '2026-04-28', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 242, '2026-04-29', '2026-04-30', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 245, '2026-05-01', '2026-05-02', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 248, '2026-05-03', '2026-05-04', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 251, '2026-05-05', '2026-05-06', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 254, '2026-05-07', '2026-05-08', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 257, '2026-05-09', '2026-05-10', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 260, '2026-05-11', '2026-05-12', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 263, '2026-05-13', '2026-05-14', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 266, '2026-05-15', '2026-05-16', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 269, '2026-05-17', '2026-05-18', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 272, '2026-05-19', '2026-05-20', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 275, '2026-05-21', '2026-05-22', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 278, '2026-05-23', '2026-05-24', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 281, '2026-05-25', '2026-05-26', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 284, '2026-05-27', '2026-05-28', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 287, '2026-05-29', '2026-05-30', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 290, '2026-06-01', '2026-06-02', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 293, '2026-06-03', '2026-06-04', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 296, '2026-06-05', '2026-06-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 299, '2026-06-07', '2026-06-08', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 302, '2026-06-09', '2026-06-10', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 305, '2026-06-11', '2026-06-12', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 308, '2026-06-13', '2026-06-14', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 311, '2026-06-15', '2026-06-16', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 314, '2026-06-17', '2026-06-18', 4, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 317, '2026-06-19', '2026-06-20', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 320, '2026-06-21', '2026-06-22', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 323, '2026-06-23', '2026-06-24', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 326, '2026-06-25', '2026-06-26', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 329, '2026-06-27', '2026-06-28', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 332, '2026-06-29', '2026-06-30', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 335, '2026-07-01', '2026-07-02', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 338, '2026-07-03', '2026-07-04', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 341, '2026-07-05', '2026-07-06', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 344, '2026-07-07', '2026-07-08', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser2', 347, '2026-07-09', '2026-07-10', 3, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 4, '2026-06-12', '2026-06-13', 1, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 11, '2026-07-08', '2026-07-09', 2, NULL, '이용완료', NULL
    UNION ALL SELECT 'testuser1', 18, '2026-08-25', '2026-08-26', 1, NULL, '이용완료', NULL
) v
JOIN (SELECT program_id, title, temple_id, ROW_NUMBER() OVER (ORDER BY program_id) AS rn FROM TEMPLE_STAY_PROGRAM) p ON p.rn = v.nth
JOIN TEMPLE t ON t.temple_id = p.temple_id;


-- =====================================================================
-- [3] 템플스테이 리뷰 73건
--
-- 리뷰는 '이용완료' 상태의 예약 1건당 1개만 달 수 있다(uq_review_reservation, chk_review_rating).
-- 예약 id를 하드코딩하지 않고, "아직 리뷰가 없는 '이용완료' 예약"을 start_date 순으로 최대 73건
-- 골라 매칭한다. 예약 시드의 auto_increment 값이 달라도, 기존 리뷰가 있어도 에러 없이 동작한다.
--
-- 주의: '이용완료' 예약이 73건보다 많은 DB(예: [2] 블록을 여러 번 실행)에서 이 파일을 반복
-- 실행하면 리뷰가 안 달린 예약이 남아있는 만큼 매번 최대 73건씩 더 채워진다. 깨끗이 다시
-- 만들려면 파일 상단 주석의 DELETE 두 줄로 비우고 시작할 것.
-- =====================================================================
INSERT INTO TEMPLE_STAY_REVIEW
    (reservation_id, login_id, rating, title, content, image_urls, like_count, created_at, updated_at)
SELECT reservation_id, login_id, rating, title, content, NULL, like_count, created_at, created_at
FROM (
    SELECT d.reservation_id,
           d.login_id,
           b.rating,
           b.title,
           b.content,
           b.like_count,
           DATE_ADD(d.end_date, INTERVAL b.days_after DAY) + INTERVAL b.hh HOUR AS created_at
    FROM (
        -- 아직 리뷰가 없는 '이용완료' 예약을 일정이 이른 순으로 1..N 번호 매김
        SELECT r.reservation_id, r.login_id, r.end_date,
               ROW_NUMBER() OVER (ORDER BY r.start_date, r.reservation_id) AS rn
        FROM TEMPLE_STAY_RESERVATION r
        WHERE r.status = '이용완료'
          AND NOT EXISTS (SELECT 1 FROM TEMPLE_STAY_REVIEW v
                          WHERE v.reservation_id = r.reservation_id)
    ) d
    JOIN (
        SELECT 1 AS rn, 5 AS rating, 14 AS like_count, 2 AS days_after, 9 AS hh,
               '산사의 새벽, 생각보다 포근했다' AS title,
               '새벽 예불 종소리에 눈을 떴는데 춥기는커녕 포근한 느낌이었습니다. 법당 안 온기와 스님 목소리가 지금도 또렷이 기억나요.' AS content
        UNION ALL SELECT 2, 3, 2, 1, 17, '일정이 너무 빡빡했던 1박 2일',
               '프로그램 하나하나는 좋았는데 쉴 틈 없이 이어져서 몸이 더 피곤했습니다. 쉬러 간 건지 수련하러 간 건지 헷갈리네요.'
        UNION ALL SELECT 3, 5, 19, 4, 11, '108배 끝나고 눈물이 났어요',
               '처음엔 다리가 후들거려서 포기할 뻔했는데, 마지막 배를 올리고 나니 이유 모를 눈물이 났습니다. 신기한 경험이었어요.'
        UNION ALL SELECT 4, 4, 7, 2, 20, '아이와 함께, 생각보다 즐거워했다',
               '아이가 지루해할까 걱정했는데 발우공양이랑 연등 만들기를 특히 재밌어했습니다. 다음에도 또 데려오고 싶어요.'
        UNION ALL SELECT 5, 2, 0, 1, 14, '방 상태가 아쉬웠던 숙소',
               '프로그램 자체는 무난했는데 방에 벌레가 있어서 신경 쓰였습니다. 위생 관리가 좀 더 필요해 보였어요.'
        UNION ALL SELECT 6, 5, 16, 3, 8, '차담 한 시간, 마음이 가벼워졌다',
               '스님과 나눈 차담에서 뜻밖의 위로를 받았습니다. 짧은 시간이었는데 마음이 한결 가벼워진 기분이었어요.'
        UNION ALL SELECT 7, 4, 5, 2, 19, '포행 코스가 생각보다 길었어요',
               '천천히 걷는 포행이 예상보다 길어서 처음엔 지루했는데, 걷다 보니 머릿속이 비워지는 느낌을 받았습니다.'
        UNION ALL SELECT 8, 5, 21, 5, 10, '세 번째 방문, 매번 새로운 걸 배운다',
               '올 때마다 몰랐던 걸 하나씩 배우게 됩니다. 이번엔 다도를 처음 제대로 배웠는데 집에서도 해보려고요.'
        UNION ALL SELECT 9, 3, 1, 1, 22, '안내 데스크 응대가 아쉬웠다',
               '체크인할 때 응대가 다소 무성의하게 느껴졌습니다. 프로그램 내용은 괜찮았는데 첫인상이 아쉬웠어요.'
        UNION ALL SELECT 10, 5, 13, 3, 9, '혼자 떠난 여행, 후회 없는 선택',
               '혼자 조용히 쉬고 싶어서 갔는데 정말 잘한 선택이었습니다. 아무도 신경 안 쓰고 온전히 제 시간을 보냈어요.'
        UNION ALL SELECT 11, 4, 8, 2, 16, '사찰음식, 생각보다 든든했다',
               '자극적이지 않아서 싱거울 줄 알았는데 의외로 든든했습니다. 재료 본연의 맛이 이런 거구나 싶었어요.'
        UNION ALL SELECT 12, 5, 17, 4, 7, '연등 만들기, 손재주 없어도 괜찮아요',
               '손재주가 없어서 걱정했는데 스님이 차근차근 알려주셔서 그럴듯하게 완성했습니다. 뿌듯했어요.'
        UNION ALL SELECT 13, 2, 1, 1, 21, '기대했던 것과는 조금 달랐던',
               '후기만 보고 기대를 많이 했는데 실제론 평범했습니다. 나쁘진 않았지만 특별하지도 않았어요.'
        UNION ALL SELECT 14, 5, 15, 3, 12, '가족 모두가 만족한 템플스테이',
               '부모님, 아이까지 삼대가 함께 갔는데 다들 좋아하셨습니다. 세대 상관없이 즐길 거리가 많았어요.'
        UNION ALL SELECT 15, 4, 6, 2, 18, '산책로가 예뻐서 자꾸 걷게 됐어요',
               '숙소 주변 산책로가 정말 예뻐서 시간 날 때마다 걸었습니다. 계절 바뀌면 또 오고 싶어요.'
        UNION ALL SELECT 16, 3, 2, 1, 13, '난방이 약했던 밤',
               '프로그램은 만족스러웠는데 밤에 방이 좀 추웠습니다. 겨울엔 옷을 더 챙겨가시는 걸 추천해요.'
        UNION ALL SELECT 17, 5, 18, 4, 10, '명상 시간, 처음으로 집중이 잘됐다',
               '평소 명상할 때마다 잡생각이 많았는데 여기선 신기하게 집중이 잘됐습니다. 환경이 다르긴 다르네요.'
        UNION ALL SELECT 18, 4, 9, 2, 15, '초보자 배려가 느껴진 프로그램',
               '뭐든 처음이라 서툴렀는데 지도해주신 분이 눈높이에 맞춰 설명해주셔서 편했습니다.'
        UNION ALL SELECT 19, 5, 12, 3, 9, '필사 시간, 뜻밖의 힐링',
               '지루할 줄 알았던 필사가 의외로 집중이 잘돼서 시간 가는 줄 몰랐습니다. 다음엔 더 긴 코스로 해보고 싶어요.'
        UNION ALL SELECT 20, 2, 0, 1, 20, '예상보다 시설이 낡았던',
               '사진으로 본 것보다 시설이 많이 낡아 있었습니다. 관리가 좀 더 필요해 보였어요.'
        UNION ALL SELECT 21, 5, 10, 2, 9, '봄바람 맞으며 걸었던 산책로',
               '산책로에 벚꽃이 흩날려서 걷는 내내 기분이 좋았습니다. 숙소도 깨끗하고 조용해서 푹 쉬다 왔어요.'
        UNION ALL SELECT 22, 4, 6, 1, 15, '참가자가 많아도 안내가 체계적이었다',
               '단체 인원이 많았는데도 동선 안내가 잘돼있어서 헤매지 않았습니다. 다음에도 믿고 올 수 있을 것 같아요.'
        UNION ALL SELECT 23, 3, 2, 3, 11, '프로그램은 괜찮은데 식사가 아쉬웠다',
               '체험 내용은 만족스러웠는데 식사량이 좀 적었습니다. 활동량에 비해 조금 부족한 느낌이었어요.'
        UNION ALL SELECT 24, 5, 15, 2, 19, '아이가 먼저 또 가자고 조른 곳',
               '아이가 돌아오는 차 안에서부터 또 가고 싶다고 했습니다. 체험 종류가 다양해서 지루할 틈이 없었어요.'
        UNION ALL SELECT 25, 4, 7, 1, 13, '새벽 산행, 힘들었지만 보람찼다',
               '생각보다 경사가 있어서 힘들었는데 정상에서 본 풍경이 그 피로를 다 씻어줬습니다.'
        UNION ALL SELECT 26, 2, 1, 1, 21, '소음이 신경 쓰였던 하룻밤',
               '옆 건물 공사 소리가 들려서 밤에 깊이 못 잤습니다. 프로그램 자체는 나쁘지 않았어요.'
        UNION ALL SELECT 27, 5, 18, 4, 10, '말차 체험, 생각보다 집중하게 됐다',
               '말차를 직접 격불하는 체험이 생각보다 섬세한 작업이라 몰입하게 됐습니다. 차맛도 좋았어요.'
        UNION ALL SELECT 28, 4, 8, 2, 16, '초행길인데도 길 찾기 어렵지 않았다',
               '내비게이션만 믿고 갔는데 안내판이 잘 돼있어서 헤매지 않고 바로 찾아갔습니다.'
        UNION ALL SELECT 29, 5, 20, 5, 9, '조용히 쉬고 싶은 분께 강력 추천',
               '정말 아무것도 안 하고 쉬고만 왔는데 그게 가장 큰 힐링이었습니다. 다음 휴가도 여기로 정했어요.'
        UNION ALL SELECT 30, 3, 1, 1, 22, '안내 자료가 좀 더 자세했으면',
               '프로그램 시간표를 현장에서야 알게 돼서 당황스러웠습니다. 사전 안내가 더 자세하면 좋겠어요.'
        UNION ALL SELECT 31, 5, 17, 3, 8, '사찰 음식 맛에 반해서 레시피를 물어봤다',
               '너무 맛있어서 조리법을 여쭤봤더니 친절하게 알려주셨습니다. 집에서도 시도해보려고요.'
        UNION ALL SELECT 32, 4, 9, 2, 14, '아침 좌선, 하루 시작이 달라졌다',
               '평소 아침잠이 많은데 좌선하고 나니 머리가 맑아진 채로 하루를 시작할 수 있었습니다.'
        UNION ALL SELECT 33, 5, 16, 4, 12, '사계절 중 봄이 제일 예쁜 것 같다',
               '벚꽃 핀 경내가 정말 예뻐서 사진을 수십 장 찍었습니다. 다른 계절에도 와보고 싶어요.'
        UNION ALL SELECT 34, 2, 0, 1, 18, '화장실 관리가 아쉬웠던 숙소',
               '전체적으로 괜찮았는데 공용 화장실 청결 상태가 아쉬웠습니다. 개선되면 좋겠어요.'
        UNION ALL SELECT 35, 4, 6, 2, 11, '단체보다는 개인 참가가 더 좋을 듯',
               '단체로 갔는데 개인적으로는 혼자 와서 조용히 즐기는 게 더 맞을 것 같다는 생각이 들었습니다.'
        UNION ALL SELECT 36, 5, 19, 3, 20, '스님 법문이 마음에 오래 남았다',
               '짧은 법문이었는데 요즘 고민과 맞닿아 있어서 오래 생각하게 됐습니다. 참 감사한 시간이었어요.'
        UNION ALL SELECT 37, 4, 10, 1, 9, '체험형 프로그램, 손으로 만드는 재미',
               '손으로 뭔가 만드는 체험이 이렇게 재밌을 줄 몰랐습니다. 완성품을 집에 가져와서 뿌듯했어요.'
        UNION ALL SELECT 38, 5, 14, 4, 17, '두 번째 방문도 역시 만족스러웠다',
               '첫 방문 때 좋아서 다시 왔는데 이번에도 실망시키지 않았습니다. 세 번째도 올 것 같아요.'
        UNION ALL SELECT 39, 3, 2, 2, 13, '날씨 때문에 야외 활동이 취소됐다',
               '우천으로 야외 프로그램이 취소돼서 아쉬웠습니다. 대체 프로그램이 있었으면 더 좋았을 것 같아요.'
        UNION ALL SELECT 40, 5, 21, 4, 10, '예불 소리에 하루의 피로가 풀렸다',
               '저녁 예불 소리를 들으며 그날 쌓인 피로가 풀리는 느낌을 받았습니다. 소리 자체가 치유였어요.'
        UNION ALL SELECT 41, 4, 7, 1, 15, '산속이라 그런지 공기가 확실히 달랐다',
               '도심과는 차원이 다른 공기였습니다. 그것만으로도 다녀온 가치가 있었어요.'
        UNION ALL SELECT 42, 2, 0, 1, 19, '예상보다 체류 공간이 좁았다',
               '사진에서 본 것보다 방이 좁게 느껴졌습니다. 짐이 많으면 다소 불편할 수 있을 것 같아요.'
        UNION ALL SELECT 43, 5, 18, 3, 11, '다도 체험, 평소 안 해본 경험이라 신기했다',
               '차를 우려 마시는 법을 제대로 배운 건 처음이라 신기하고 재밌었습니다. 다음엔 지인과 함께 오고 싶어요.'
        UNION ALL SELECT 44, 4, 8, 2, 16, '산길 산책, 생각보다 운동이 됐다',
               '가볍게 걷는 코스인 줄 알았는데 생각보다 땀이 났습니다. 운동 겸 힐링으로 딱이었어요.'
        UNION ALL SELECT 45, 5, 15, 4, 9, '연휴에 가족과 함께, 최고의 선택',
               '연휴를 어떻게 보낼까 고민하다 여기로 정했는데 가족 모두 만족했습니다. 내년에도 또 올 것 같아요.'
        UNION ALL SELECT 46, 3, 1, 1, 20, '설명이 빨라서 놓친 부분이 있었다',
               '체험 설명이 조금 빨리 진행돼서 몇 부분은 놓쳤습니다. 천천히 다시 짚어주면 좋을 것 같아요.'
        UNION ALL SELECT 47, 5, 17, 3, 12, '마음을 비우고 싶을 때 다녀오세요',
               '복잡했던 머릿속이 다녀오고 나니 한결 정리됐습니다. 비슷한 고민 있는 분들께 추천합니다.'
        UNION ALL SELECT 48, 4, 9, 2, 14, '초보자도 어렵지 않게 따라갈 수 있었다',
               '처음 해보는 것투성이였는데 지도해주신 분 덕분에 어렵지 않게 따라갔습니다.'
        UNION ALL SELECT 49, 5, 16, 5, 8, '세 번째 방문, 매번 다른 매력이 있다',
               '올 때마다 계절이 달라서 매번 새로운 느낌입니다. 이번엔 여름이라 또 다른 매력이 있었어요.'
        UNION ALL SELECT 50, 2, 0, 1, 21, '기대가 너무 컸던 탓인지 평범했다',
               '후기를 너무 많이 찾아보고 가서 그런지 생각보다 평범하게 느껴졌습니다. 나쁘진 않았어요.'
        UNION ALL SELECT 51, 5, 20, 4, 10, '발우공양, 생각보다 엄숙한 분위기였다',
               '예상보다 진지하고 엄숙한 분위기라 처음엔 긴장했는데 끝나고 나니 특별한 경험으로 남았습니다.'
        UNION ALL SELECT 52, 4, 7, 1, 17, '숙소는 소박해도 마음은 편안했다',
               '시설이 화려하진 않았지만 그래서 더 마음이 편했습니다. 꾸밈없는 그대로가 좋았어요.'
        UNION ALL SELECT 53, 5, 19, 3, 9, '혼자 다녀왔는데 전혀 심심하지 않았다',
               '혼자 가서 심심할까 걱정했는데 프로그램이 알차서 시간이 금방 갔습니다.'
        UNION ALL SELECT 54, 3, 2, 2, 18, '사찰음식이 입맛에는 안 맞았다',
               '건강식이라는 건 알겠는데 제 입맛엔 좀 심심했습니다. 그래도 몸은 편안한 느낌이었어요.'
        UNION ALL SELECT 55, 5, 14, 4, 11, '연등 만들기 체험, 집중력이 필요했다',
               '생각보다 세밀한 작업이라 집중력이 필요했습니다. 완성하고 나니 성취감이 컸어요.'
        UNION ALL SELECT 56, 4, 8, 1, 13, '아이 동반 가족에게 추천하고 싶다',
               '아이가 참여할 체험이 많아서 지루해하지 않았습니다. 가족 단위로 오기 좋은 곳이었어요.'
        UNION ALL SELECT 57, 5, 17, 5, 10, '네 번째 방문, 단골이 돼버렸다',
               '벌써 네 번째인데 올 때마다 집처럼 편안합니다. 스님들도 이제 저를 알아보세요.'
        UNION ALL SELECT 58, 2, 1, 1, 22, '프로그램 변경 안내가 늦었다',
               '당일 아침에야 일정 변경을 안내받아서 당황스러웠습니다. 미리 알려주셨으면 좋았을 것 같아요.'
        UNION ALL SELECT 59, 5, 16, 3, 9, '포행하며 들은 새소리가 아직도 생생하다',
               '천천히 걸으며 들었던 새소리와 바람 소리가 아직도 귀에 선합니다. 정말 평화로운 시간이었어요.'
        UNION ALL SELECT 60, 4, 9, 2, 15, '필사 체험, 생각보다 손이 아팠다',
               '오랜만에 손으로 글씨를 쓰니 손목이 아프긴 했지만, 마음만은 차분해지는 시간이었습니다.'
        UNION ALL SELECT 61, 5, 18, 4, 8, '단풍철 아니어도 경치가 아름다웠다',
               '단풍철이 아닌데도 경내 풍경이 충분히 아름다웠습니다. 단풍철엔 얼마나 예쁠지 기대돼요.'
        UNION ALL SELECT 62, 3, 1, 1, 19, '프로그램 간 이동 시간이 길었다',
               '장소 간 이동 시간이 생각보다 길어서 체력 소모가 있었습니다. 그 점만 빼면 만족스러웠어요.'
        UNION ALL SELECT 63, 5, 20, 5, 11, '인생 사진 건진 템플스테이',
               '어딜 찍어도 사진이 예쁘게 나와서 인생 사진을 여러 장 건졌습니다. 풍경 자체가 작품이었어요.'
        UNION ALL SELECT 64, 4, 7, 2, 16, '초등학생 자녀와 다녀오기 좋았다',
               '초등학생 아이도 지루해하지 않을 정도로 체험이 다양했습니다. 눈높이에 맞춘 설명도 좋았어요.'
        UNION ALL SELECT 65, 2, 0, 1, 20, '벌레가 많아서 조금 불편했다',
               '여름이라 그런지 벌레가 좀 많았습니다. 벌레 기피제를 챙겨가시는 걸 추천드려요.'
        UNION ALL SELECT 66, 5, 15, 3, 10, '차담에서 들은 이야기가 인생 조언 같았다',
               '스님과의 차담 중에 들은 말씀이 뜻밖의 인생 조언처럼 느껴졌습니다. 오래 곱씹게 되네요.'
        UNION ALL SELECT 67, 4, 8, 1, 14, '여름 휴가로 다녀왔는데 시원했다',
               '산속이라 그런지 도심보다 훨씬 시원했습니다. 여름 휴가지로 손색없는 곳이었어요.'
        UNION ALL SELECT 68, 5, 17, 4, 9, '퇴근 후 바로 떠난 1박 2일, 완벽했다',
               '금요일 퇴근하자마자 떠났는데 짧아도 완벽한 재충전이었습니다. 다음 달에 또 예약했어요.'
        UNION ALL SELECT 69, 3, 1, 2, 17, '좋았지만 재방문 의사는 보통',
               '전반적으로 무난했지만 특별히 다시 찾을 만큼의 임팩트는 없었습니다.'
        UNION ALL SELECT 70, 5, 19, 5, 12, '마지막 날 아쉬워서 눈물이 날 뻔했다',
               '떠나는 날 아쉬운 마음이 커서 눈물이 날 뻔했습니다. 그만큼 좋았다는 뜻이겠죠. 꼭 다시 올게요.'
        UNION ALL SELECT 71, 5, 3, 2, 9, '오랜만에 푹 잤던 밤',
               '평소 잠을 잘 못 자는 편인데 여기서는 웬일인지 푹 잤습니다. 방이 조용하고 이부자리도 편했어요. 아침 산책 코스도 짧지 않게 잘 짜여 있었습니다.'
        UNION ALL SELECT 72, 4, 2, 3, 14, '단체 발우공양, 특별한 경험',
               '단체 체험이라 조금 정신없긴 했지만, 다 같이 발우공양을 하는 경험이 특별했습니다. 다음엔 개인으로 조용히 와보고 싶어요.'
        UNION ALL SELECT 73, 5, 5, 1, 12, '두 번째 방문, 저를 기억해주셔서 놀람',
               '두 번째로 방문한 곳인데 스태프분들이 저를 기억해주셔서 놀랐습니다. 프로그램 구성도 지난번보다 다양해져서 좋았어요.'
    ) b ON b.rn = d.rn
) x;
