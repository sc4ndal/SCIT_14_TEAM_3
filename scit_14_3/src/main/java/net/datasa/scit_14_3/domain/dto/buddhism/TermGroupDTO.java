package net.datasa.scit_14_3.domain.dto.buddhism;

import net.datasa.scit_14_3.domain.TermCategory;

import java.util.List;

/*
	소분류 하나와 거기에 속한 용어 카드들.
	화면의 탭/필터 하나가 이 그룹 하나에 대응한다.
 */
public record TermGroupDTO(TermCategory category, List<TermCardDTO> terms) {

	public String code() {
		return category.getCode();
	}

	public String label() {
		return category.getLabel();
	}

	public String description() {
		return category.getDescription();
	}

	public int size() {
		return terms.size();
	}
}
