package net.datasa.scit_14_3.domain.dto.temple;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempleDTO {
	private Long templeId;
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
	private boolean isTemple;
	private String specialNotice;
	private String loginId;
	private String password;
	private boolean mustChangePassword;
}
