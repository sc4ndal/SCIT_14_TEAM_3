package net.datasa.scit_14_3.domain.entity.buddhism;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
	불교 한마디(명언/경전 문구) 1건.
	날짜 컬럼이 없어 "오늘의 한마디"는 DailyQuoteService가 날짜를 시드로 목록에서
	하나를 고정 선택하는 방식으로 흉내낸다(DB에는 그냥 전체 목록만 있음).
 */
@Entity
@Table(name = "DAILY_QUOTE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyQuoteEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "quote_id")
	private Long quoteId;

	@Column(name = "content", nullable = false)
	private String content;

	@Column(name = "source", length = 100)
	private String source;
}
