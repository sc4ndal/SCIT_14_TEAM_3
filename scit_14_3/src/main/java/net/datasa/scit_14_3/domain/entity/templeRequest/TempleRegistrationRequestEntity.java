package net.datasa.scit_14_3.domain.entity.templeRequest;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE_REGISTRATION_REQUEST")
public class TempleRegistrationRequestEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "request_id")
	private Long requestId;

	@Column(name = "name", length = 100, nullable = false)
	private String name;

	@Column(name = "image_url", length = 255)
	private String imageUrl;

	@Column(name = "latitude", precision = 10, scale = 7, nullable = false)
	private BigDecimal latitude;

	@Column(name = "longitude", precision = 10, scale = 7, nullable = false)
	private BigDecimal longitude;

	@Column(name = "address", length = 255, nullable = false)
	private String address;

	@Column(name = "region", length = 20, nullable = false)
	private String region;

	// 장소 유형 중복 선택 가능(TEMPLE과 동일한 이유로 boolean 4개, 2026-08-31 변경)
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

	@Column(name = "special_notice", columnDefinition = "TEXT")
	private String specialNotice;

	@Column(name = "contact_email", length = 100, nullable = false)
	private String contactEmail;

	public enum Status { 대기, 승인 }

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private Status status = Status.대기;

	@Column(name = "approved_temple_id")
	private Long approvedTempleId;

	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;
}
