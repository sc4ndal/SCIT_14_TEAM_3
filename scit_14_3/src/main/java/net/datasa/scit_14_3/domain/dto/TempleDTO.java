package net.datasa.scit_14_3.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.datasa.scit_14_3.domain.entity.TempleEntity;

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
	private String region;
	private TempleEntity.LocationType locationType;
	private boolean supportEnglish;
	private boolean isTemple;
	private String specialNotice;
	private String loginId;
	private String password;
}
