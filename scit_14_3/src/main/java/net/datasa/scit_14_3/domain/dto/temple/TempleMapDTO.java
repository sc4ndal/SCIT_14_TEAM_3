package net.datasa.scit_14_3.domain.dto.temple;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TempleMapDTO {
	private Long templeId;
	private String name;
	private String imageUrl;
	private Double latitude;
	private Double longitude;
	private String address;
	private String locationType;	// 산/강/도심/바다
}
