package net.datasa.scit_14_3.domain;

import net.datasa.scit_14_3.domain.dto.FaqItemDTO;
import net.datasa.scit_14_3.domain.dto.NextCardDTO;
import net.datasa.scit_14_3.domain.dto.RoadmapStepDTO;

import java.util.List;

/*
	"불교란?" 페이지에 들어가는 고정 콘텐츠.

	7단계로 확정된 로드맵이라 항목 수가 늘거나 줄지 않고, 단계마다 붙는 일러스트도
	DB(BUDDHISM_INFO)에 이미지 컬럼이 없어 정적 파일로 처리한다. 그래서 본문도
	DB가 아니라 여기 상수로 둔다. 문구 수정은 이 파일만 고치면 된다.

	1~6단계는 지그재그로 반복되는 STEPS, 7단계는 와이어프레임의 "마지막 내용 영역"에
	해당해서 FINAL_STEP으로 따로 뺐다.
 */
public final class BuddhismIntroContent {

	private BuddhismIntroContent() {
	}

	public static final List<RoadmapStepDTO> STEPS = List.of(
			new RoadmapStepDTO(1, "불교란 무엇인가", "한 사람이 던진 질문에서 시작했습니다",
					List.of(
							"2500여 년 전 인도의 왕자 고타마 싯다르타는 늙고 병들고 죽는 삶을 보고 궁을 떠났습니다.",
							"오랜 수행 끝에 그는 괴로움의 정체와 그것을 벗어나는 길을 깨달았고, 그때부터 '부처(깨달은 이)'라 불렸습니다.",
							"불교는 이 깨달음을 신에게 비는 대신 스스로 따라 걸어보는 가르침입니다."),
					"/images/buddhism/roadmap-01.svg", "보리수 아래에 앉은 사람의 그림"),

			new RoadmapStepDTO(2, "핵심 가르침", "괴로움을 다루는 네 가지 진실",
					List.of(
							"부처가 가장 먼저 말한 것은 사성제입니다. 삶에는 괴로움이 있고(고), 거기엔 원인이 있고(집), 그 원인은 없앨 수 있으며(멸), 없애는 길이 있다(도)는 네 단계입니다.",
							"그 마지막 '길'을 여덟 갈래로 풀어놓은 것이 팔정도입니다. 바르게 보고, 말하고, 행동하고, 집중하는 삶의 태도를 뜻합니다.",
							"거창한 규율이라기보다 '어떻게 살면 덜 괴로운가'에 대한 아주 오래된 대답입니다."),
					"/images/buddhism/roadmap-02.svg", "여덟 개의 살이 있는 법륜 그림"),

			new RoadmapStepDTO(3, "불교가 보는 세상", "모든 것은 이어져 있고, 머무르지 않습니다",
					List.of(
							"연기 — 세상에 홀로 생겨나는 것은 없고, 모든 일은 조건이 모여 일어납니다.",
							"무상 — 그래서 무엇도 그대로 머무르지 않습니다. 좋은 일도 나쁜 일도 지나갑니다.",
							"무아와 공 — '변하지 않는 나'라고 붙잡을 만한 알맹이도 실은 없다는 이야기입니다. 허무하다는 뜻이 아니라, 그만큼 달라질 수 있다는 뜻입니다."),
					"/images/buddhism/roadmap-03.svg", "물 위에 번지는 파문 그림"),

			new RoadmapStepDTO(4, "수행이란", "가르침을 머리가 아니라 몸으로 익히기",
					List.of(
							"명상은 생각을 억지로 없애는 일이 아니라, 지금 이 순간의 호흡과 몸을 알아차리는 연습입니다.",
							"자비는 그 알아차림을 나에게서 남에게로 넓히는 연습입니다.",
							"둘 다 특별한 재능이 필요하지 않습니다. 10분 앉아 있는 것부터가 수행입니다."),
					"/images/buddhism/roadmap-04.svg", "가부좌를 튼 사람의 실루엣"),

			new RoadmapStepDTO(5, "그 끝에는", "괴로움이 꺼진 자리",
					List.of(
							"열반은 타오르던 불이 꺼지듯 욕심과 성냄, 어리석음이 잦아든 상태를 말합니다.",
							"해탈은 그렇게 묶여 있던 것에서 풀려나는 것입니다.",
							"멀고 어려운 이야기처럼 들리지만, 마음이 한결 가벼워지는 짧은 순간들이 그 방향의 첫 조각입니다."),
					"/images/buddhism/roadmap-05.svg", "꺼진 촛불에서 피어오르는 연기 그림"),

			new RoadmapStepDTO(6, "절에서 만나는 이들", "스님, 신도, 그리고 보살",
					List.of(
							"스님은 출가해 수행하는 분들입니다. 마주치면 가볍게 합장하고 목례하면 충분합니다.",
							"신도는 절에 다니며 배우고 실천하는 일반인들입니다. 특별한 자격이 필요하지 않습니다.",
							"보살은 자기 깨달음만이 아니라 남까지 함께 건너가려는 이를 가리킵니다."),
					"/images/buddhism/roadmap-06.svg", "합장한 두 손 그림")
	);

	/*
		마지막 단계. 로드맵 정보를 템플스테이로 이어주는 자리라
		다른 단계와 달리 화면에서도 넓은 영역으로 따로 렌더링한다.
	 */
	public static final RoadmapStepDTO FINAL_STEP = new RoadmapStepDTO(
			7, "그래서 템플스테이에서는", "읽은 것을 하룻밤 동안 직접 겪어봅니다",
			List.of(
					"여기까지 읽은 내용은 사실 글로 익히는 것보다 한 번 겪어보는 쪽이 훨씬 빠릅니다.",
					"템플스테이에서는 새벽 예불에 앉아보고, 발우공양으로 밥을 먹고, 108배를 하며 절 하나에 생각 하나씩을 내려놓습니다.",
					"불교를 믿기로 결심하고 가는 자리가 아닙니다. 며칠 조용히 지내고 싶은 사람에게도 산문은 그대로 열려 있습니다."),
			"/images/buddhism/roadmap-07.svg", "산속 절의 새벽 풍경 그림");

	/** 절에 처음 가면 할 수 있는 것 */
	public static final List<String> CAN_DO = List.of(
			"법당에 들어가 부처님께 삼배 올리기",
			"조용히 앉아 향 냄새를 맡으며 10분 쉬어가기",
			"경내를 천천히 한 바퀴 걸어보기",
			"공양간에서 사찰음식으로 점심 먹기",
			"소원을 적어 등이나 기와에 매달기");

	/** 안 해도 되는 것 — 심리적 장벽을 낮추는 자리 */
	public static final List<String> NEED_NOT = List.of(
			"불교 신자가 되겠다고 밝히기",
			"염불이나 경전 구절을 외워 가기",
			"돈을 꼭 내기 (시주는 말 그대로 마음이 내킬 때만)");

	public static final List<FaqItemDTO> FAQS = List.of(
			new FaqItemDTO("불교 신자가 아닌데 절에 가도 되나요?",
					"됩니다. 대부분의 사찰은 종교와 상관없이 누구에게나 열려 있습니다. 관광으로 들르는 분도, 그냥 쉬러 오는 분도 많습니다."),
			new FaqItemDTO("입장료나 돈을 내야 하나요?",
					"문화재 관람료를 받는 일부 사찰을 빼면 대개 무료입니다. 법당 앞 시주함은 의무가 아니라 원하는 분만 넣는 곳입니다."),
			new FaqItemDTO("예절이 복잡해서 실수할까 걱정돼요.",
					"법당에 들어갈 때 신발을 벗고, 조용히 말하고, 사진을 찍기 전에 물어보는 것 — 이 세 가지면 충분합니다. 실수해도 나무라는 사람은 없습니다."),
			new FaqItemDTO("다른 종교를 믿는데 같이 다녀도 되나요?",
					"불교는 개종을 요구하지 않습니다. 명상이나 사찰음식처럼 관심 가는 부분만 가져가셔도 괜찮습니다.")
	);

	public static final List<NextCardDTO> NEXT_CARDS = List.of(
			new NextCardDTO("사찰 예절 가이드", "가기 전에 딱 이것만 알고 가면 됩니다", "/info?category=예절가이드"),
			new NextCardDTO("사찰 찾기", "가까운 절부터 지도에서 찾아보세요", "/temples"),
			new NextCardDTO("체험하기", "템플스테이 프로그램을 둘러보세요", "/programs")
	);
}
