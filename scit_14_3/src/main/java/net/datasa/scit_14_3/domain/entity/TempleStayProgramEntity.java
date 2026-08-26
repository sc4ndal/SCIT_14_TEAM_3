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
@Table(name = "temple_stay_program")
public class TempleStayProgramEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "program_id")
	private Long programId;
	
	@Column(name = "temple_id")
	private Long templeId;
	
	@Column(name = "title", length = 100)
	private String title;
	
	public enum ProgramType {
		당일형, 체험형, 휴식형
	}
	@Enumerated(EnumType.STRING)
	@Column(name = "program_type")
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
	
	@Column(name = "price")
	private int price;
	
	@Column(name = "duration", length = 20)
	private String duration;
	
	@Builder.Default
	@Column(name = "max_participant")
	private int maxParticipant = 20;
	
	@Builder.Default
	@Column(name = "support_english")
	private boolean supportEnglish = false;
	
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
