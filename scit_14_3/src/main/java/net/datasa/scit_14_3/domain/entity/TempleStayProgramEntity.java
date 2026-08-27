package net.datasa.scit_14_3.domain.entity;

import jakarta.persistence.*;
import lombok.*;

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
	
	@Column(name = "temple_id", nullable = false)
	private Long templeId;
	
	@Column(name = "title", length = 100, nullable = false)
	private String title;
	
	public enum ProgramType {
		당일형, 체험형, 휴식형
	}
	@Enumerated(EnumType.STRING)
	@Column(name = "program_type", nullable = false)
	private ProgramType programType;
	
	@Column(name = "description", columnDefinition = "TEXT")
	private String description;
	
	@Column(name = "schedule", columnDefinition = "TEXT")
	private String schedule;
	
	@Column(name = "required_items", columnDefinition = "TEXT")
	private String requiredItems;
	
	@Column(name = "refund_policy", columnDefinition = "TEXT")
	private String refundPolicy;
	
	@Column(name = "precautions", columnDefinition = "TEXT")
	private String precautions;
	
	@Column(name = "price", nullable = false)
	private int price;
	
	@Column(name = "duration", length = 20, nullable = false)
	private String duration;
	
	@Builder.Default
	@Column(name = "max_participant", nullable = false)
	private int maxParticipant = 20;
	
	@Builder.Default
	@Column(name = "support_english", nullable = false)
	private boolean supportEnglish = false;
	
	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;
}
