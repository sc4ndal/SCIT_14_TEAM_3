package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "FAVORITE_TEMPLE")
public class FavoriteTempleEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "favorite_id", nullable = false)
	private Long favoriteId;
	
	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;
	
	@ManyToOne
	@JoinColumn(name = "temple_id", nullable = false)
	private TempleEntity temple;
	
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
