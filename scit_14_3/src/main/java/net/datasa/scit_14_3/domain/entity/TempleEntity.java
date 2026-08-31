package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

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

		@Column(name = "image_url", length = 255)
		private String imageUrl;

		// 지도 API 장소 ID(api_place_id) 대신 좌표로 위치를 받음
		@Column(name = "latitude", precision = 10, scale = 7, nullable = false)
		private BigDecimal latitude;

		@Column(name = "longitude", precision = 10, scale = 7, nullable = false)
		private BigDecimal longitude;

		@Column(name = "address", length = 255, nullable = false)
		private String address;

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
