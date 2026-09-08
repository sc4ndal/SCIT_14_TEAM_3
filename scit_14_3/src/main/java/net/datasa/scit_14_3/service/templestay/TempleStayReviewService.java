package net.datasa.scit_14_3.service.templestay;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReviewDTO;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReviewEntity;
import net.datasa.scit_14_3.repository.templestay.TempleStayReservationRepository;
import net.datasa.scit_14_3.repository.templestay.TempleStayReviewRepository;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayReviewService {
	private final TempleStayReviewRepository tsrvr;
	private final TempleStayReservationRepository tsrr;
	private final CloudinaryService cloudinaryService;

	// Cloudinary 무료 플랜(장당 10MB) + 요청 크기 제한 안에서 감당 가능한 최대 첨부 장수
	public static final int MAX_IMAGES = 5;

	/**
	 * 리뷰 작성 - 본인의 예약이면서 이용완료 상태여야 하고, 예약 1건당 리뷰 1개만 허용한다.
	 * (DB에도 reservation_id UNIQUE 제약이 있어 이중으로 막힘)
	 */
	public TempleStayReviewDTO write(TempleStayReviewDTO dto) {
		try {
			TempleStayReservationEntity reservation = tsrr.findById(dto.getReservationId())
					.orElseThrow(() -> new EntityNotFoundException("해당되는 예약이 존재하지 않습니다."));

			if (!reservation.getLoginId().equals(dto.getLoginId())) {
				throw new IllegalStateException("본인의 예약에만 리뷰를 작성할 수 있습니다.");
			}
			if (reservation.getStatus() != TempleStayReservationEntity.Status.이용완료) {
				throw new IllegalStateException("이용이 완료된 예약만 리뷰를 작성할 수 있습니다.");
			}
			if (tsrvr.findByReservationId(dto.getReservationId()).isPresent()) {
				throw new IllegalStateException("이미 이 예약에 대한 리뷰를 작성했습니다.");
			}
			if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
				throw new IllegalStateException("평점은 1~5점 사이로 입력해주세요.");
			}
			if (dto.getContent() == null || dto.getContent().isBlank()) {
				throw new IllegalStateException("리뷰 내용을 입력해주세요.");
			}
			validateImageUrls(dto.getImageUrls());

			TempleStayReviewEntity entity = TempleStayReviewEntity.builder()
					.reservationId(dto.getReservationId())
					.loginId(dto.getLoginId())
					.rating((byte) (int) dto.getRating())
					.content(dto.getContent())
					.imageUrls(dto.getImageUrls())
					.build();

			return toDto(tsrvr.save(entity));
		} catch (RuntimeException e) {
			// 새 리뷰라 dto의 사진은 전부 이번 요청에서 /api/images/upload로 새로 올라간 것들이다.
			// 저장이 실패했으니 Cloudinary에 고아로 남지 않게 전부 정리 대상으로 삼는다(소유권 확인은 아래서).
			cleanupOrphanCandidates(dto.getImageUrls(), null, null);
			throw e;
		}
	}

	public TempleStayReviewDTO getByReservationId(Long reservationId) {
		return tsrvr.findByReservationId(reservationId).map(this::toDto).orElse(null);
	}

	/** 마이페이지 > 내가 쓴 리뷰 */
	public List<TempleStayReviewDTO> findByMyReviews(String loginId) {
		List<TempleStayReviewDTO> result = new ArrayList<>();
		for (TempleStayReviewEntity entity : tsrvr.findByLoginIdOrderByCreatedAtDesc(loginId)) {
			result.add(toDto(entity));
		}
		return result;
	}

	/** 리뷰 수정 - 작성자 본인만 가능. */
	public TempleStayReviewDTO update(Long reviewId, String loginId, TempleStayReviewDTO dto) {
		List<String> oldImageUrls = Collections.emptyList();
		try {
			TempleStayReviewEntity entity = tsrvr.findById(reviewId)
					.orElseThrow(() -> new EntityNotFoundException("해당되는 리뷰가 존재하지 않습니다."));

			oldImageUrls = entity.getImageUrls() != null ? entity.getImageUrls() : Collections.emptyList();

			if (!entity.getLoginId().equals(loginId)) {
				throw new IllegalStateException("본인이 작성한 리뷰만 수정할 수 있습니다.");
			}
			if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
				throw new IllegalStateException("평점은 1~5점 사이로 입력해주세요.");
			}
			if (dto.getContent() == null || dto.getContent().isBlank()) {
				throw new IllegalStateException("리뷰 내용을 입력해주세요.");
			}
			validateImageUrls(dto.getImageUrls());

			// 첨삭으로 목록에서 빠진(=사용자가 삭제한) 기존 사진은 Cloudinary에서도 지운다
			List<String> newImageUrls = dto.getImageUrls() != null ? dto.getImageUrls() : Collections.emptyList();
			for (String oldUrl : oldImageUrls) {
				if (!newImageUrls.contains(oldUrl)) {
					cloudinaryService.delete(oldUrl);
				}
			}

			entity.setRating((byte) (int) dto.getRating());
			entity.setContent(dto.getContent());
			// 컨트롤러가 "유지할 기존 URL + 새로 업로드한 URL"을 합쳐서 넘겨준다 - 그대로 덮어쓰면 첨삭이 반영됨
			entity.setImageUrls(dto.getImageUrls());

			return toDto(entity);
		} catch (RuntimeException e) {
			// 검증 실패로 저장이 안 됐어도 dto.imageUrls 중 새로 업로드된 것들은 이미 Cloudinary에
			// 올라가 있다 - 원래 이 리뷰 것(oldImageUrls)이거나 다른 리뷰가 쓰는 중인 건 건드리지 않고
			// 진짜 이번 요청에서 새로 올라간 것만 골라서 정리한다.
			cleanupOrphanCandidates(dto.getImageUrls(), oldImageUrls, reviewId);
			throw e;
		}
	}

	/** 리뷰 삭제 - 작성자 본인만 가능. */
	public void delete(Long reviewId, String loginId) {
		TempleStayReviewEntity entity = tsrvr.findById(reviewId)
				.orElseThrow(() -> new EntityNotFoundException("해당되는 리뷰가 존재하지 않습니다."));
		if (!entity.getLoginId().equals(loginId)) {
			throw new IllegalStateException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
		}

		List<String> imageUrls = entity.getImageUrls();
		tsrvr.delete(entity);

		// DB 삭제가 우선 - Cloudinary 정리는 부가 작업이라 실패해도 리뷰 삭제 자체는 이미 끝난 뒤다
		if (imageUrls != null) {
			for (String url : imageUrls) {
				cloudinaryService.delete(url);
			}
		}
	}

	/** 사진 장수 제한 + 우리 Cloudinary 계정 소유가 아닌 URL(조작/외부 URL) 차단 */
	private void validateImageUrls(List<String> imageUrls) {
		if (imageUrls == null) {
			return;
		}
		if (imageUrls.size() > MAX_IMAGES) {
			throw new IllegalStateException("사진은 최대 " + MAX_IMAGES + "장까지 첨부할 수 있습니다.");
		}
		for (String url : imageUrls) {
			if (!cloudinaryService.isManagedUrl(url)) {
				throw new IllegalStateException("올바르지 않은 이미지입니다.");
			}
		}
	}

	/**
	 * 저장 실패 시 이번 요청으로 새로 업로드된(=아직 어떤 리뷰에도 안 붙은) 사진만 골라 Cloudinary에서
	 * 정리한다. alreadyOwnedUrls(이 리뷰가 원래 갖고 있던 것)나 다른 리뷰가 이미 쓰고 있는 URL은
	 * 절대 지우지 않는다 - 남의 사진을 실수로 지우는 사고를 막기 위함.
	 */
	private void cleanupOrphanCandidates(List<String> candidateUrls, List<String> alreadyOwnedUrls, Long excludingReviewId) {
		if (candidateUrls == null) {
			return;
		}
		for (String url : candidateUrls) {
			if (!cloudinaryService.isManagedUrl(url)) {
				continue; // 우리 계정 것만 정리 대상 - 외부/조작된 URL은 건드리지 않음
			}
			if (alreadyOwnedUrls != null && alreadyOwnedUrls.contains(url)) {
				continue; // 원래 이 리뷰 것 - 지우면 안 됨
			}
			if (isUsedByAnotherReview(url, excludingReviewId)) {
				continue; // 다른 리뷰가 쓰는 중인 사진 - 지우면 안 됨
			}
			cloudinaryService.delete(url);
		}
	}

	// 리뷰 수가 많지 않은 서비스 규모라 전체 스캔으로도 충분함(더 커지면 JSON_CONTAINS 네이티브 쿼리로 교체)
	private boolean isUsedByAnotherReview(String url, Long excludingReviewId) {
		return tsrvr.findAll().stream()
				.filter(r -> excludingReviewId == null || !r.getReviewId().equals(excludingReviewId))
				.anyMatch(r -> r.getImageUrls() != null && r.getImageUrls().contains(url));
	}

	private TempleStayReviewDTO toDto(TempleStayReviewEntity entity) {
		return TempleStayReviewDTO.builder()
				.reviewId(entity.getReviewId())
				.reservationId(entity.getReservationId())
				.loginId(entity.getLoginId())
				.rating((int) entity.getRating())
				.content(entity.getContent())
				.imageUrls(entity.getImageUrls())
				.likeCount(entity.getLikeCount())
				.viewCount(entity.getViewCount())
				.createdAt(entity.getCreatedAt())
				.updatedAt(entity.getUpdatedAt())
				.build();
	}
}
