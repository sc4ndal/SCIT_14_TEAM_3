-- ============================================================
-- TEMPLE_EVENT(사찰 행사) 데이터 - 2026-09-16 링크 정확도 개선
--
-- 홈 화면 "월간 불교 행사" 캘린더(/templeevents API, home.js loadCalendarEvents)와
-- 찾아보기 > 불교 행사(/events, temple/events.html) 페이지가 함께 읽어가는 데이터입니다.
--
-- 이번에 바뀐 점 (2026-09-16)
--   "자세히 보기" 링크가 buddhism.or.kr/위키백과/공공데이터포털처럼 그 행사와 직접
--   상관없는 범용 사이트로 걸려 있던 게 대부분이었다 - 전부 "그 행사를 주최/개최하는
--   사찰의 공식 홈페이지" 또는 "그 행사를 구체적으로 다루는 기사"로 교체했다.
--   (예: 백중기도는 위키백과 '백중날' 문서 대신 통도사 공식 홈페이지로,
--        추석 합동차례는 원래 조계사로 잘못 걸려있던 걸 실제 주최 사찰인 불국사로 교정)
--   사찰 공식 홈페이지 목록:
--     조계사 https://www.jogyesa.kr · 봉은사 http://www.bongeunsa.org/
--     해인사 http://www.haeinsa.or.kr/ · 통도사 https://www.tongdosa.or.kr/
--     화엄사 http://www.hwaeomsa.or.kr/ · 불국사 https://www.bulguksa.or.kr/
--     범어사(부산국제불교박람회 공식 사이트 이용) · 동화사(엑스포 공식 사이트 이용)
--     용주사 https://www.yongjoosa.org/ · 증심사 https://jeungsimsa.org/
--   박람회/축제처럼 사찰 하나가 아니라 별도 조직위가 주최하는 행사는 그 공식 행사
--   사이트(bexpo.kr, busanbexpo.kr, bexpodg.kr 등)나 구체적으로 다루는 기사를 그대로 쓴다.
--
-- ⚠ 재실행 안내: 기존 TEMPLE_EVENT 데이터를 전부 지우고 다시 넣는 스크립트입니다.
-- FAVORITE_EVENT가 TEMPLE_EVENT를 참조하므로, 누군가 이미 행사를 즐겨찾기했다면
-- 이 스크립트를 재실행하기 전에 반드시 확인하세요(ON DELETE CASCADE로 같이 삭제됨).
--
-- 출가절/성도절/열반절/하안거/백중/동안거처럼 음력 기반인 항목은 매년 양력 날짜가
-- 바뀌므로, 새해 데이터를 넣을 때는 그해 날짜를 다시 확인해야 합니다(불교신문
-- ibulgyo.com 등에서 "OO년 성도절/출가절/열반절 날짜"로 검색하면 그 해 보도가 나옵니다).
-- 박람회·행복두배 템플스테이·연등회처럼 주최 측이 그때그때 날짜를 정해 발표하는 행사는
-- 아직 공지 전인 해에는 넣지 않는다 - 공식 일정이 나오면 그때 추가할 것.
-- ============================================================

-- USE scit_14_3;   -- 사용 중인 스키마에 맞게 여세요

DELETE FROM FAVORITE_EVENT;
DELETE FROM TEMPLE_EVENT;

INSERT INTO TEMPLE_EVENT (temple_id, title, description, start_date, end_date, link_url) VALUES

-- ============================================================
-- 2025년(작년) - 전부 실제 보도/공식 사이트 기준 확정 날짜
-- ============================================================
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '정초기도', '새해를 맞아 한 해의 평안과 발원을 기원하는 정초 기도 법회입니다.', '2025-01-01', '2025-01-07', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '성도절', '부처님께서 보리수 아래에서 깨달음을 이루신 것을 기념하는 불교 4대 명절 중 하나입니다.', '2025-01-07', '2025-01-07', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '출가절', '부처님께서 세속의 삶을 떠나 수행자의 길로 들어선 것을 기념하는 불교 4대 명절 중 하나입니다.', '2025-03-07', '2025-03-07', 'http://www.haeinsa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '열반절', '부처님께서 80세에 열반에 드신 것을 기념하는 불교 4대 명절 중 하나입니다.', '2025-03-14', '2025-03-14', 'https://www.tongdosa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '행복두배 템플스테이', '문화체육관광부·한국관광공사와 연계해 전국 113개 사찰이 참여한 템플스테이 참가비 반값 할인 캠페인입니다(2025년은 3·6·11월 세 차례 운영, 아래는 3월분).', '2025-03-07', '2025-03-31', 'https://www.templestay.com'),
((SELECT temple_id FROM TEMPLE WHERE name = '봉은사'), '서울국제불교박람회', '국내 최대 규모의 불교 문화·용품 박람회로, 전국 사찰과 단체가 참가해 법요집·불교용품·전통차·사찰음식 등을 소개합니다. (서울 코엑스)', '2025-04-03', '2025-04-06', 'https://www.bexpo.kr/fair/2025bexpo'),
((SELECT temple_id FROM TEMPLE WHERE name = '증심사'), '사직연등축제', '광주 사직공원 일대에서 열리는 연등 행사로, 봉축탑과 소원등 점등식, 작은 음악회가 함께 진행됩니다. (제7회)', '2025-04-14', '2025-05-06', 'https://www.startuptoday.co.kr/news/articleView.html?idxno=435287'),
((SELECT temple_id FROM TEMPLE WHERE name = '용주사'), '용주사 연등음악축제', '화성시불교사암연합회와 용주사, 화성시가 함께 여는 행사로, 연등행렬과 체험부스, 저녁의 연등음악회로 이어집니다.', '2025-04-19', '2025-04-19', 'https://www.asiae.co.kr/article/2025041511193296546'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '연등축제 전통문화마당', '유네스코 인류무형문화유산 연등회 기간 중 열리는 전통문화 체험 행사로, 연등 만들기·전통차 시음·불교 공예 체험 등 다양한 부스가 운영됩니다.', '2025-04-26', '2025-04-27', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '봉은사'), '부처님오신날 연등법회', '부처님오신날을 봉축하는 연등법회와 점등식이 열립니다.', '2025-05-05', '2025-05-05', 'http://www.bongeunsa.org/'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '하안거 결제법회', '스님들이 여름 석 달간 한곳에 머물며 수행에 전념하는 하안거가 시작됩니다.', '2025-05-12', '2025-05-12', 'http://www.haeinsa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '범어사'), '부산국제불교박람회', '부산 벡스코에서 열리는 영남권 최대 규모의 불교 문화·용품 박람회입니다.', '2025-08-07', '2025-08-10', 'http://busanbexpo.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '사찰음식 국제학술 심포지엄', '사찰음식의 국가무형유산 지정을 기념해 처음 열린 국제 학술 행사입니다. (국립고궁박물관 강당)', '2025-08-19', '2025-08-19', 'http://www.ibulgyo.com/news/articleView.html?idxno=440774'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '백중기도', '조상의 영가를 천도하고 은혜에 감사하는 백중(우란분절) 기도일이며, 같은 날 하안거 해제 법회도 함께 열립니다.', '2025-09-03', '2025-09-06', 'https://www.tongdosa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '동화사'), '대한민국불교문화엑스포', '대구 엑스코에서 열리는 불교문화 종합 박람회입니다.', '2025-09-11', '2025-09-14', 'https://www.bexpodg.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '불국사'), '추석 합동차례', '한가위를 맞아 대웅전에서 합동 차례와 감사 기도를 올립니다.', '2025-10-06', '2025-10-06', 'https://www.bulguksa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '화엄사'), '동안거 결제법회', '겨울 석 달간의 수행 정진이 시작되는 동안거 결제 법회입니다.', '2025-12-04', '2025-12-04', 'http://www.hwaeomsa.or.kr/'),

-- ============================================================
-- 2026년(올해)
-- ============================================================
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '정초기도', '새해를 맞아 한 해의 평안과 발원을 기원하는 정초 기도 법회입니다.', '2026-01-01', '2026-01-07', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '성도절', '부처님께서 보리수 아래에서 깨달음을 이루신 것을 기념하는 불교 4대 명절 중 하나입니다.', '2026-01-26', '2026-01-26', 'http://www.ibulgyo.com/news/articleView.html?idxno=434983'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '출가절', '부처님께서 세속의 삶을 떠나 수행자의 길로 들어선 것을 기념하는 불교 4대 명절 중 하나입니다.', '2026-03-26', '2026-03-26', 'http://www.ibulgyo.com/news/articleView.html?idxno=437221'),
((SELECT temple_id FROM TEMPLE WHERE name = '봉은사'), '서울국제불교박람회', '국내 최대 규모의 불교 문화·용품 박람회로, 전국 사찰과 단체가 참가해 법요집·불교용품·전통차·사찰음식 등을 소개합니다. (서울 코엑스 Hall B)', '2026-04-02', '2026-04-05', 'https://www.bexpo.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '열반절', '부처님께서 80세에 열반에 드신 것을 기념하는 불교 4대 명절 중 하나입니다.', '2026-04-02', '2026-04-02', 'http://www.ibulgyo.com/news/articleView.html?idxno=437221'),
((SELECT temple_id FROM TEMPLE WHERE name = '증심사'), '사직연등축제', '광주 사직공원 일대에서 열리는 연등 행사로, 봉축탑과 소원등 점등식, 작은 음악회가 함께 진행됩니다.', '2026-04-30', '2026-05-20', 'https://jeungsimsa.org/'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '행복두배 템플스테이', '문화체육관광부·한국관광공사와 연계해 전국 120여 개 사찰이 참여하는 템플스테이 참가비 반값 할인 캠페인입니다(1박2일 3만원, 외국인 대상 당일형 1만5천원).', '2026-05-01', '2026-05-31', 'https://www.templestay.com'),
((SELECT temple_id FROM TEMPLE WHERE name = '용주사'), '용주사 연등음악축제', '화성시불교사암연합회와 용주사, 화성특례시가 함께 여는 행사로, 연등행렬과 체험부스, 저녁의 연등음악회로 이어집니다.', '2026-05-16', '2026-05-16', 'https://www.hsinews.com/51691'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '연등축제 전통문화마당', '유네스코 인류무형문화유산 연등회 기간 중 열리는 전통문화 체험 행사로, 연등 만들기·전통차 시음·불교 공예 체험 등 다양한 부스가 운영됩니다.', '2026-05-16', '2026-05-17', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '봉은사'), '부처님오신날 연등법회', '부처님오신날을 봉축하는 연등법회와 점등식이 열립니다.', '2026-05-24', '2026-05-24', 'http://www.bongeunsa.org/'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '하안거 결제법회', '스님들이 여름 석 달간 한곳에 머물며 수행에 전념하는 하안거가 시작됩니다.', '2026-05-31', '2026-05-31', 'http://www.haeinsa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '동화사'), '대한민국불교문화엑스포', '대구 엑스코에서 열리는 불교문화 종합 박람회로, 전통문화 체험·법요용품 전시·반려동물 동반 프로그램 등이 함께 진행됩니다.', '2026-06-11', '2026-06-14', 'https://www.bexpodg.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '범어사'), '부산국제불교박람회', '부산 벡스코에서 열리는 영남권 최대 규모의 불교 문화·용품 박람회입니다.', '2026-08-06', '2026-08-09', 'http://busanbexpo.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '2026 사찰음식 국제학술 심포지엄', '한국·일본·이탈리아·미국 등 각국 전문가가 모여 사찰음식의 세계 음식문화로서의 가치를 논하는 국제 학술 행사입니다. (한국불교역사문화기념관)', '2026-08-20', '2026-08-20', 'http://www.ibulgyo.com/news/articleView.html?idxno=441389'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '백중기도', '조상의 영가를 천도하고 은혜에 감사하는 백중(우란분절) 기도일이며, 같은 날 하안거 해제 법회도 함께 열립니다.', '2026-08-24', '2026-08-27', 'https://www.tongdosa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '불국사'), '추석 합동차례', '한가위를 맞아 대웅전에서 합동 차례와 감사 기도를 올립니다.', '2026-09-25', '2026-09-25', 'https://www.bulguksa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '화엄사'), '동안거 결제법회', '겨울 석 달간의 수행 정진이 시작되는 동안거 결제 법회입니다.', '2026-11-23', '2026-11-23', 'http://www.hwaeomsa.or.kr/'),

-- ============================================================
-- 2027년(내년) - 음력 기반이라 매년 계산 가능한 명절/안거/추석만 포함.
-- 박람회·행복두배 템플스테이·연등회처럼 주최 측이 그때그때 날짜를 정해 발표하는
-- 행사는 2026-09-16(오늘) 기준 아직 공지 전이라 넣지 않았다 - 공식 일정이 나오면 추가할 것.
-- ============================================================
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '정초기도', '새해를 맞아 한 해의 평안과 발원을 기원하는 정초 기도 법회입니다.', '2027-01-01', '2027-01-07', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '조계사'), '성도절', '부처님께서 보리수 아래에서 깨달음을 이루신 것을 기념하는 불교 4대 명절 중 하나입니다. (음력-양력 환산값)', '2027-01-15', '2027-01-15', 'https://www.jogyesa.kr'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '출가절', '부처님께서 세속의 삶을 떠나 수행자의 길로 들어선 것을 기념하는 불교 4대 명절 중 하나입니다. (음력-양력 환산값)', '2027-03-15', '2027-03-15', 'http://www.haeinsa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '열반절', '부처님께서 80세에 열반에 드신 것을 기념하는 불교 4대 명절 중 하나입니다. (음력-양력 환산값)', '2027-03-22', '2027-03-22', 'https://www.tongdosa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '봉은사'), '부처님오신날 연등법회', '부처님오신날을 봉축하는 연등법회와 점등식이 열립니다. (2027년 법정공휴일 지정일)', '2027-05-13', '2027-05-13', 'http://www.bongeunsa.org/'),
((SELECT temple_id FROM TEMPLE WHERE name = '해인사'), '하안거 결제법회', '스님들이 여름 석 달간 한곳에 머물며 수행에 전념하는 하안거가 시작됩니다. (음력-양력 환산값)', '2027-05-20', '2027-05-20', 'http://www.haeinsa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '통도사'), '백중기도', '조상의 영가를 천도하고 은혜에 감사하는 백중(우란분절) 기도일이며, 같은 날 하안거 해제 법회도 함께 열립니다. (음력-양력 환산값)', '2027-08-16', '2027-08-16', 'https://www.tongdosa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '불국사'), '추석 합동차례', '한가위를 맞아 대웅전에서 합동 차례와 감사 기도를 올립니다.', '2027-09-15', '2027-09-15', 'https://www.bulguksa.or.kr/'),
((SELECT temple_id FROM TEMPLE WHERE name = '화엄사'), '동안거 결제법회', '겨울 석 달간의 수행 정진이 시작되는 동안거 결제 법회입니다. (음력-양력 환산값)', '2027-11-12', '2027-11-12', 'http://www.hwaeomsa.or.kr/');
