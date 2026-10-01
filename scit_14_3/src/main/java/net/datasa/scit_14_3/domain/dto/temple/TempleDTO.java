package net.datasa.scit_14_3.domain.dto.temple;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Builder(toBuilder = true)
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
	private BigDecimal rating; // 리뷰 평균 평점(캐시) - 리뷰 없으면 null
	private int reviewCount;   // 몇 건으로 나온 평균인지(신뢰도 표시용)
	private String specialNotice;
	private String refundPolicy;
	private String loginId;
	private String password;
	private boolean mustChangePassword;
	private boolean favorited; // 로그인한 회원이 이 사찰을 즐겨찾기 했는지 - 목록 조회 시에만 채워짐(TempleService는 안 채움)
}
