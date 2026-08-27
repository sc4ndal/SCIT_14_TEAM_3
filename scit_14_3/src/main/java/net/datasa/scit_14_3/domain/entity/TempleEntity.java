package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE")
public class TempleEntity {
		@Id
		@GeneratedValue(strategy = GenerationType.IDENTITY)
		@Column(name = "temple_id", nullable = false)
		private Long templeId;
		
		@Column(name = "name", length = 100, nullable = false)
		private String name;
	
		@Column(name = "api_place_id", length = 100, unique = true, nullable = false)
		private String apiPlaceId;
	
		@Column(name = "region", length = 20, nullable = false)
		private String region;
	
		public enum LocationType {
		바다, 산, 강, 도심
		}
		@Enumerated(EnumType.STRING)
		@Column(name = "location_type", nullable = false)
		private LocationType locationType;
	
		@Column(name = "support_english", nullable = false)
		private boolean supportEnglish;
		
		@Builder.Default
		@Column(name = "is_temple", nullable = false)
		private boolean isTemple = true;
	
		@Column(name = "special_notice", columnDefinition = "TEXT")
		private String specialNotice;
		
		@Column(name = "login_id", length = 30, unique = true, nullable = false)
		private String loginId;
		
		@Column(name = "password", length = 255, nullable = false)
		private String password;
}
