package net.datasa.scit_14_3.domain.entity.temple;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/*
	회원이 저장(즐겨찾기)한 사찰 행사.
	(login_id, event_id) 조합에 DB UNIQUE 제약이 걸려 있어 중복 저장이 안 된다.
 */
@Entity
@Table(name = "FAVORITE_EVENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteEventEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "favorite_event_id")
	private Long favoriteEventId;

	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;

	@ManyToOne
	@JoinColumn(name = "event_id", nullable = false)
	private TempleEventEntity event;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
