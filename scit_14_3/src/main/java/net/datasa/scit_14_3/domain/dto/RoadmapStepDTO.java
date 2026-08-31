package net.datasa.scit_14_3.domain.dto;

import java.util.List;

/*
	"불교란?" 로드맵의 한 단계.

	BUDDHISM_INFO에는 이미지 컬럼도 단계 순서 컬럼도 없고 단계 수가 7개로 고정이라
	DB가 아니라 BuddhismIntroContent의 상수로 관리한다.

	step  : 화면에 찍히는 단계 번호(01, 02 ...)
	image : /static 아래 정적 일러스트 경로 (Figma 확정 후 파일만 교체하면 된다)
 */
public record RoadmapStepDTO(
		int step,
		String title,
		String subtitle,
		List<String> lines,
		String image,
		String imageAlt
) {
	/** 지그재그 배치용 — 홀수 단계는 일러스트가 왼쪽, 짝수 단계는 오른쪽 */
	public boolean isImageLeft() {
		return step % 2 == 1;
	}
}
