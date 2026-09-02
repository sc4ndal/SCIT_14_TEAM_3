package net.datasa.scit_14_3.domain.entity.temple;

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
	
		// 장소 유형은 하나만 고르는 게 아니라 중복 가능(바다+도심 등)이라 ENUM 한 컬럼 대신
		// support_english와 같은 방식으로 유형별 boolean 컬럼을 둠(2026-08-31 변경)
		@Column(name = "support_sea", nullable = false)
		private boolean supportSea;

		@Column(name = "support_mountain", nullable = false)
		private boolean supportMountain;

		@Column(name = "support_river", nullable = false)
		private boolean supportRiver;

		@Column(name = "support_urban", nullable = false)
		private boolean supportUrban;

		@Column(name = "support_english", nullable = false)
		private boolean supportEnglish;
		
		@Builder.Default
		@Column(name = "is_temple", nullable = false)
		private boolean isTemple = true;
	
		// 사찰별 개별 유의사항 - 이 사찰이 등록하는 모든 프로그램의 "유의사항"으로도 그대로 쓰임
		// (프로그램마다 따로 안 받음, TempleStayProgramEntity 조회 시 여기서 조인해서 보여줌).
		@Column(name = "special_notice", columnDefinition = "TEXT")
		private String specialNotice;

		// 환불 규정도 같은 이유로 프로그램별이 아니라 여기 있음 - 등록 폼에서 관리.
		@Column(name = "refund_policy", columnDefinition = "TEXT")
		private String refundPolicy;

		@Column(name = "login_id", length = 30, unique = true, nullable = false)
		private String loginId;
		
		@Column(name = "password", length = 255, nullable = false)
		private String password;

		// 관리자가 임시 비밀번호를 발급해 등록한 계정은 true - 로그인 시 비밀번호 변경 페이지로 강제 이동됨
		@Builder.Default
		@Column(name = "must_change_password", nullable = false)
		private boolean mustChangePassword = false;
}
