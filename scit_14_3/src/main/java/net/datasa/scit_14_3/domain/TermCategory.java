package net.datasa.scit_14_3.domain;

import lombok.Getter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/*
	"불교 용어" 페이지의 8개 소분류.

	DB(BUDDHISM_INFO)에는 category='용어'로만 저장하고 소분류 컬럼은 두지 않는다.
	용어 개수가 고정적이라 아래처럼 제목 기준 정적 매핑으로 그룹핑하는 방식으로 결정했다.
	용어를 새로 추가할 때는 seed SQL과 이 목록 양쪽에 제목을 똑같이 넣어야 한다.
	(여기에 없는 제목은 ETC로 떨어져 화면 맨 뒤 "기타" 그룹에 표시된다.)
 */
@Getter
public enum TermCategory {

	DOCTRINE("doctrine", "기본교리", "붓다가 남긴 가르침의 뼈대",
			List.of("사성제", "팔정도", "십이인연", "중도", "업", "연기", "공", "무상", "무아")),

	PRACTICE("practice", "수행법", "가르침을 몸으로 익히는 방법",
			List.of("명상", "좌선", "선정", "반야", "정진", "자비")),

	STATE("state", "경계·상태", "수행이 깊어지며 다다르는 상태",
			List.of("열반", "해탈", "깨달음", "삼매")),

	PERSON("person", "인물", "절에서 만나게 되는 사람들",
			List.of("부처", "보살", "아라한", "스님", "신도")),

	PLACE("place", "장소", "사찰과 그 안의 건물들",
			List.of("사찰", "일주문", "당간지주", "해탈교", "천왕문", "불이문",
					"탑", "법당", "경루", "범종·목어·운판", "요사")),

	RITUAL("ritual", "의식", "절에서 이루어지는 의례",
			List.of("법회", "기도", "염불", "절(예경)", "공양", "108배")),

	FAITH("faith", "신앙", "믿음의 대상과 한국 불교의 종파",
			List.of("삼보", "계", "만다라", "사리", "염주",
					"조계종", "천태종", "진각종", "한국 불교의 세 가지 특징")),

	SCRIPTURE("scripture", "경전", "불교의 책들 — 처음 읽기 좋은 순서로",
			List.of("경", "논", "율", "삼장", "반야심경", "법화경", "화엄경")),

	ETC("etc", "기타", "아직 분류되지 않은 용어", List.of());

	private final String code;
	private final String label;
	private final String description;
	private final List<String> titles;

	/** 제목 -> 소분류 조회용 색인 (enum 초기화 시 한 번만 만든다) */
	private static final Map<String, TermCategory> BY_TITLE = new LinkedHashMap<>();

	static {
		for (TermCategory category : values()) {
			for (String title : category.titles) {
				BY_TITLE.put(title, category);
			}
		}
	}

	TermCategory(String code, String label, String description, List<String> titles) {
		this.code = code;
		this.label = label;
		this.description = description;
		this.titles = titles;
	}

	/** 용어 제목이 속한 소분류. 매핑에 없으면 ETC */
	public static TermCategory of(String title) {
		return BY_TITLE.getOrDefault(title, ETC);
	}

	/** 소분류 안에서의 표시 순서. 매핑에 없으면 맨 뒤로 */
	public int orderOf(String title) {
		int index = titles.indexOf(title);
		return index < 0 ? Integer.MAX_VALUE : index;
	}
}
