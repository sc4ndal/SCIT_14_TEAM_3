package net.datasa.scit_14_3.domain.entity.inquiry;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "INQUIRY")
public class InquiryEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "inquiry_id")
	private Long inquiryId;

	@Column(name = "login_id", length = 30, nullable = false)
	private String loginId;

	@Column(name = "title", length = 100, nullable = false)
	private String title;

	@Column(name = "content", columnDefinition = "TEXT", nullable = false)
	private String content;

	@Column(name = "answer", columnDefinition = "TEXT")
	private String answer;

	public enum Status { 대기, 답변완료 }

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private Status status = Status.대기;

	@Column(name = "created_at", insertable = false, updatable = false, nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "answered_at")
	private LocalDateTime answeredAt;
}
