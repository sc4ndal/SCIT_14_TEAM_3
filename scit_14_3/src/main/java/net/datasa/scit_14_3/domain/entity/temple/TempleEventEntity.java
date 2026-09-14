package net.datasa.scit_14_3.domain.entity.temple;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/*
	사찰 행사(불교행사) 1건 - 홈 화면 "월간 불교 행사" 캘린더에 표시된다.
	FAVORITE_EVENT(관심 행사) 즐겨찾기는 아직 이 엔티티에서 다루지 않음 - 필요해지면
	FavoriteTempleEntity와 같은 방식으로 추가하면 된다.
 */
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE_EVENT")
public class TempleEventEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "event_id")
	private Long eventId;

	@ManyToOne
	@JoinColumn(name = "temple_id", nullable = false)
	private TempleEntity temple;

	@Column(name = "title", length = 150, nullable = false)
	private String title;

	@Column(name = "description", columnDefinition = "TEXT")
	private String description;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;

	@Column(name = "link_url", length = 255)
	private String linkUrl;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
