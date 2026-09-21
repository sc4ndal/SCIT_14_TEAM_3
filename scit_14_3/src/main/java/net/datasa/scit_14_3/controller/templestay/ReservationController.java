package net.datasa.scit_14_3.controller.templestay;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.domain.dto.templestay.ReservationParticipantDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.security.AppUserDetails;
import net.datasa.scit_14_3.service.payment.PaymentService;
import net.datasa.scit_14_3.service.templestay.ReservationParticipantService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ReservationController {
	private final TempleStayReservationService tsrs;
	private final ReservationParticipantService rps;
	private final PaymentService ps;
	
	@GetMapping("/reservation")
	public String Reservation() {
		return "templestay/reservation";
	}

	/** 전체 후기 모아보기 (아직 빈 페이지 - 목록 API/렌더링은 추후 구현) */
	@GetMapping("/reservation/reviews")
	public String reviews() {
		return "templestay/reviews";
	}

	/** 프로그램 상세보기 - 예전엔 /reservation 안 모달이었는데, 뒤로가기 누르면 이전 페이지(가이드 등)로
	    바로 나가버려서 진짜 페이지로 분리함(programDetail.js가 데이터는 알아서 fetch해서 채움). */
	@GetMapping("/reservation/programs/{programId}")
	public String programDetail(@PathVariable Long programId, Model model) {
		model.addAttribute("programId", programId);
		return "templestay/programDetail";
	}

	/**
	 * 템플스테이 프로그램 생성
	 *
	 */
	@PostMapping("/templestayreservations")
	@ResponseBody
	public ResponseEntity<?> TempleStayReservation(@RequestBody TempleStayReservationDTO TempleStayReservationDTO,
			@CookieValue(value = "preferredLang", defaultValue = "ko") String preferredLang) {
		// 화면 언어는 common.js가 쿠키(preferredLang)로 저장해둠 - 안내 메일을 그 언어로 보내려고 예약에 같이 저장
		TempleStayReservationDTO.setLang(preferredLang);
		try {
			return ResponseEntity.ok(tsrs.reserved(TempleStayReservationDTO));
		} catch (IllegalStateException e) {
			// 정원 초과 등 - 프론트에서 메시지 그대로 alert로 띄움(reservation.js 참고)
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		}
	}
	
	/**
	 * 참가자 생성
	 *
	 */
	@PostMapping("/reservationparticipants")
	@ResponseBody
	public List<ReservationParticipantDTO> ReservationParticipant(@RequestBody List<ReservationParticipantDTO> ReservationParticipantDTO) {
		return rps.reserved(ReservationParticipantDTO);
	}
	
	/**
	 * 결제 생성
	 *
	 */
	@PostMapping("/payments")
	@ResponseBody
	public PaymentDTO payment(@RequestBody PaymentDTO paymentDTO) {
		return ps.reserved(paymentDTO);
	}
	
	/** 본인 예약 목록만 반환 - 이 경로 자체는 PUBLIC_URLS에 열려있어(컨트롤러 내부 개별 인증) 클라이언트가
	    보낸 loginId를 그대로 믿으면 남의 예약을 조회할 수 있었다. principal 기준으로만 조회한다. */
	@GetMapping("/templestayreservations")
	@ResponseBody
	public List<TempleStayReservationDTO> getTempleStayReservation(@AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return List.of();
		}
		return tsrs.findByMyReservation(principal.getUsername());
	}

	/** 본인 예약만 조회 가능 - reservationId는 URL/쿼리스트링에 그대로 노출되는 값이라(카카오페이
	    리다이렉트 등) 아무 숫자나 넣어서 남의 예약 정보(날짜/인원 등)를 볼 수 있으면 안 된다. */
	/** 예약이 존재하지 않는 경우, isOwner() 안에서 NullPointerException이 나면서 500 에러(서버 내부 오류)로 떨어질 수 있다.
	 * 서버 내부 오류 방지 위해 사용자에게는 "예약을 찾을 수 없습니다" 같은 깔끔한 404 응답을 준다. */
	@GetMapping("/templestayreservations/{reservationId}")
	@ResponseBody
	public ResponseEntity<?> getTempleStayReservationById(@PathVariable Long reservationId,
			@AuthenticationPrincipal AppUserDetails principal) {
		TempleStayReservationDTO dto = tsrs.getInfo(reservationId);
		if (dto == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", "존재하지 않는 예약입니다."));
		}
		if (!isOwner(dto, principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 예약만 조회할 수 있습니다."));
		}
		return ResponseEntity.ok(dto);
	}

	/** 본인 예약의 결제 정보만 조회 가능 - 위와 같은 이유(reservationId가 URL에 노출됨)로,
	    소유자 확인 없이 열어두면 결제 금액/수단 같은 정보가 그대로 새어나간다. */
	@GetMapping("/payments/reservation/{reservationId}")
	@ResponseBody
	public ResponseEntity<?> getPaymentByReservations(@PathVariable Long reservationId,
			@AuthenticationPrincipal AppUserDetails principal) {
		TempleStayReservationDTO reservation = tsrs.getInfo(reservationId);
		if (reservation == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", "존재하지 않는 예약입니다."));
		}
		if (!isOwner(reservation, principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 예약만 조회할 수 있습니다."));
		}
		return ResponseEntity.ok(ps.findByReservationId(reservationId));
	}

	private boolean isOwner(TempleStayReservationDTO reservation, AppUserDetails principal) {
		return principal != null && reservation != null
				&& reservation.getLoginId() != null
				&& reservation.getLoginId().equals(principal.getUsername());
	}

	/** 예약목록 화면에서 예약마다 결제 정보를 하나씩 불러오면(N+1) 느려서, 로그인한 본인의 예약 전체
	    결제 정보를 한 번에 조회. 클라이언트가 예약 ID 목록을 넘기는 방식이 아니라 서버가 principal
	    기준으로 본인 예약만 찾아서 그 안에서만 조회함 - 남의 예약 ID를 넣어서 결제 정보를 엿볼 수
	    없도록(기존 /payments/reservation/{id} 단건 조회는 이 검증이 없어서 그대로 두면 같이 뚫림).
	    결제 정보가 없는 예약(대기 등)은 응답 맵에 그 id가 아예 없음. */
	@GetMapping("/payments/my-reservations")
	@ResponseBody
	public Map<Long, PaymentDTO> getMyPayments(@AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			return Map.of();
		}
		List<Long> myReservationIds = tsrs.findByMyReservation(principal.getUsername()).stream()
				.map(TempleStayReservationDTO::getReservationId)
				.toList();
		return ps.findByReservationIds(myReservationIds);
	}
	
	/** 본인 예약만 취소 가능 - 확인 없이 열어두면 reservationId만 알면(URL에 그대로 노출됨) 아무나
	    남의 예약을 취소시킬 수 있었다(조회보다 더 위험한 상태변경 API인데 이게 더 허술했음). */
	@PatchMapping("/templestayreservations/{reservationId}/cancel")
	@ResponseBody
	public ResponseEntity<?> canceledReservation(@PathVariable Long reservationId,
			@AuthenticationPrincipal AppUserDetails principal) {
		var reservation = tsrs.getInfo(reservationId);
		if (reservation == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("message", "존재하지 않는 예약입니다."));
		}
		if (!isOwner(reservation, principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 예약만 취소할 수 있습니다."));
		}
		try {
			TempleStayReservationDTO canceled = tsrs.canceledMyReservation(reservationId);
			ps.notifyReservationCanceled(reservationId);
			return ResponseEntity.ok(canceled);
		} catch (IllegalStateException e) {
			// 체크인 24시간 전 취소 마감 등 - 프론트에서 메시지 그대로 alert로 띄움
			return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
		}
	}
}
