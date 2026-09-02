package net.datasa.scit_14_3.domain.dto.buddhism;

/*
	"불교 용어" 사전의 용어 카드 한 장.
	difficulty는 경전 카테고리에서만 쓰는 난이도 배지(⭐ ~ ⭐⭐⭐)이고, 나머지는 null이다.
 */
public record TermCardDTO(Long postId, String title, String content, String difficulty) {

	public boolean hasDifficulty() {
		return difficulty != null && !difficulty.isBlank();
	}
}
