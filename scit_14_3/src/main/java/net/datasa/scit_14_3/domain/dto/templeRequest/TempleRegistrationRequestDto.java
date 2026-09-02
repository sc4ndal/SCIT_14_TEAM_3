package net.datasa.scit_14_3.domain.dto.templeRequest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.templeRequest.TempleRegistrationRequestEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleRegistrationRequestDto {
	private Long requestId;
	private String name;
	private String imageUrl;
	private BigDecimal latitude;
	private BigDecimal longitude;
	private String address;
	private String region;
	private boolean supportSea;
	private boolean supportMountain;
	private boolean supportRiver;
	private boolean supportUrban;
	private boolean supportEnglish;
	private String specialNotice;
	private String refundPolicy;
	private String contactEmail;
	private TempleRegistrationRequestEntity.Status status;
	private Long approvedTempleId;
	private LocalDateTime createdAt;
}
