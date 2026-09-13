package net.datasa.scit_14_3.domain.dto.temple;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/*
	홈 화면 "월간 불교 행사" 캘린더(home.js loadCalendarEvents)에 내려주는 사찰 행사 1건.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleEventDTO {
	private Long eventId;
	private Long templeId;
	private String templeName;
	private String title;
	private String description;
	// HTML5 <input type="date">/JS Date 파싱과의 호환을 위해 yyyy-MM-dd로 고정
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	private LocalDate startDate;
	@DateTimeFormat(pattern = "yyyy-MM-dd")
	private LocalDate endDate;
	private String linkUrl;
}
