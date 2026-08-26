package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "temple")
public class TempleEntity {
		@Id
		@GeneratedValue(strategy = GenerationType.IDENTITY)
		@Column(name = "temple_id")
		private Long templeId;
		
		@Column(name = "name", length = 100)
		private String name;
	
		@Column(name = "api_place_id", length = 100, unique = true)
		private String apiPlaceId;
	
		@Column(name = "region", length = 20)
		private String region;
	
		public enum LocationType {
		바다, 산, 강, 도심
		}
		@Enumerated(EnumType.STRING)
		private LocationType locationType;
	
		@Column(name = "support_english")
		private boolean supportEnglish;
		
		@Builder.Default
		@Column(name = "is_temple")
		private boolean isTemple = true;
	
		@Column(name = "special_notice", columnDefinition = "TEXT")
		private String specialNotice;
		
		@Column(name = "login_id", length = 30, unique = true)
		private String loginId;
		
		@Column(name = "password", length = 255)
		private String password;
}
