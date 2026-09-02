package net.datasa.scit_14_3.domain.entity.templestay;

import jakarta.persistence.*;
import lombok.*;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "TEMPLE_STAY_PROGRAM")
public class TempleStayProgramEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "program_id")
	private Long programId;
	
	@ManyToOne
	@JoinColumn(name = "temple_id", nullable = false)
	private TempleEntity temple;
	
	@Column(name = "title", length = 100, nullable = false)
	private String title;
	
	public enum ProgramType {
		당일형, 체험형, 휴식형
	}
	@Enumerated(EnumType.STRING)
	@Column(name = "program_type", nullable = false)
	private ProgramType programType;

	@Column(name = "image_url", length = 255, nullable = false)
	private String imageUrl;

	@Column(name = "description", columnDefinition = "TEXT")
	private String description;
	
	@Column(name = "schedule", columnDefinition = "TEXT")
	private String schedule;
	
	@Column(name = "required_items", columnDefinition = "TEXT")
	private String requiredItems;
	// 환불 규정/유의사항은 사찰 공통이라 여기 없음 - temple.getRefundPolicy()/getSpecialNotice() 참고.

	@Column(name = "price", nullable = false)
	private int price;

	@Column(name = "duration", length = 20, nullable = false)
	private String duration;

	// duration(체류 기간)과 다른 개념: 이 프로그램을 언제부터 언제까지 모집/운영하는지의 기간.
	@Column(name = "open_start_date", nullable = false)
	private LocalDate openStartDate;

	@Column(name = "open_end_date", nullable = false)
	private LocalDate openEndDate;

	@Builder.Default
	@Column(name = "max_participant", nullable = false)
	private int maxParticipant = 20;
	
	// 아래 세 컬럼은 DB 트리거가 소속 TEMPLE의 값으로 저장 시점에 덮어씀 (docs/buddhist-site-schema.sql 참고)
	@Builder.Default
	@Column(name = "support_english", nullable = false)
	private boolean supportEnglish = false;

	@Column(name = "latitude", precision = 10, scale = 7, nullable = false)
	private BigDecimal latitude;

	@Column(name = "longitude", precision = 10, scale = 7, nullable = false)
	private BigDecimal longitude;

	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;
}
