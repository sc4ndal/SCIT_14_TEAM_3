package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	로드맵이 끝난 뒤 "다음으로 무엇을 볼까요?" 3카드.
	알아보기에서 다른 대분류로 흩어지는 회유 동선이다.
 */
public record NextCardDTO(String title, String description, String href) {
}
