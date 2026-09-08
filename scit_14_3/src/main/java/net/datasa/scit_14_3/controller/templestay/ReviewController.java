package net.datasa.scit_14_3.controller.templestay;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReviewDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.templestay.TempleStayReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 사진은 여기서 직접 업로드하지 않는다 - ImageUploadController(/api/images/upload)에 먼저 올려서
 * 받은 URL을 reviewWrite.js가 imageUrls에 담아 보내는 방식(다른 등록 폼들과 동일한 컨벤션).
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/reviews")
public class ReviewController {
	private final TempleStayReviewService reviewService;

	/** 리뷰 작성 (mypage/reviewWrite.html) - loginId는 요청 바디를 믿지 않고 로그인 정보에서 가져온다. */
	@PostMapping
	public ResponseEntity<?> write(@AuthenticationPrincipal AppUserDetails principal,
	                                @RequestBody TempleStayReviewDTO dto) {
		dto.setLoginId(principal.getUsername());
		try {
			return ResponseEntity.ok(reviewService.write(dto));
		} catch (EntityNotFoundException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
		} catch (IllegalStateException e) {
			// 이용완료 아닌 예약, 이미 작성한 리뷰, 사진 장수 초과 등 - 프론트에서 메시지 그대로 alert로 띄움
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		} catch (Exception e) {
			// GlobalExceptionHandler(뷰 기반)로 새면 JSON이 아니라 에러 HTML이 내려가 프론트가 파싱을
			// 못 하고 뭉뚱그린 메시지만 보여주게 된다 - 이 API는 항상 JSON으로 답해야 해서 여기서 막는다.
			log.error("리뷰 작성 중 예상하지 못한 오류", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "리뷰 저장 중 오류가 발생했습니다."));
		}
	}

	/**
	 * 예약 1건에 달린 리뷰 조회 - 작성 페이지 진입 시 중복 작성 여부 체크, 예약목록의 리뷰
	 * 수정/삭제 버튼 노출 여부 판단용. 리뷰는 항상 예약 본인만 쓸 수 있으므로 남의 리뷰까지
	 * 조회되지 않도록 작성자 본인이 아니면 존재 여부를 알려주지 않고 그냥 404로 응답한다.
	 */
	@GetMapping("/reservation/{reservationId}")
	public ResponseEntity<TempleStayReviewDTO> getByReservationId(@AuthenticationPrincipal AppUserDetails principal,
	                                                                @PathVariable Long reservationId) {
		TempleStayReviewDTO dto = reviewService.getByReservationId(reservationId);
		if (dto == null || !dto.getLoginId().equals(principal.getUsername())) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(dto);
	}

	/** 마이페이지 > 내가 쓴 리뷰 */
	@GetMapping
	public List<TempleStayReviewDTO> getMyReviews(@RequestParam String loginId) {
		return reviewService.findByMyReviews(loginId);
	}

	/**
	 * 리뷰 수정 - 사진 첨삭(기존 사진 유지/삭제 + 새 사진 추가) 포함. 새 사진은 프론트가 먼저
	 * /api/images/upload로 올려서 URL을 받아온 뒤, 유지할 기존 URL과 합쳐 imageUrls로 통째로 보낸다.
	 */
	@PatchMapping("/{reviewId}")
	public ResponseEntity<?> update(@AuthenticationPrincipal AppUserDetails principal,
	                                 @PathVariable Long reviewId,
	                                 @RequestBody TempleStayReviewDTO dto) {
		try {
			return ResponseEntity.ok(reviewService.update(reviewId, principal.getUsername(), dto));
		} catch (EntityNotFoundException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		} catch (Exception e) {
			log.error("리뷰 수정 중 예상하지 못한 오류", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "리뷰 저장 중 오류가 발생했습니다."));
		}
	}

	@DeleteMapping("/{reviewId}")
	public ResponseEntity<?> delete(@AuthenticationPrincipal AppUserDetails principal,
	                                 @PathVariable Long reviewId) {
		try {
			reviewService.delete(reviewId, principal.getUsername());
			return ResponseEntity.noContent().build();
		} catch (EntityNotFoundException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		} catch (Exception e) {
			log.error("리뷰 삭제 중 예상하지 못한 오류", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "리뷰 삭제 중 오류가 발생했습니다."));
		}
	}
}
