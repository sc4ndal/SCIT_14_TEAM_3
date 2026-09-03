package net.datasa.scit_14_3.service.payment;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.payment.PaymentEntity;
import net.datasa.scit_14_3.domain.entity.templestay.TempleStayReservationEntity;
import net.datasa.scit_14_3.repository.payment.PaymentRepository;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {
	private final PaymentRepository pr;
	private final KakaoPayService kakaoPayService;
	private final TempleStayReservationService reservationService;

	@Value("${kakaopay.callback-base}")
	private String callbackBase;
	public PaymentDTO getInfo(Long paymentId) {
		PaymentEntity entity = pr.findById(paymentId).orElseThrow(() -> new EntityNotFoundException("해당 데이터가 존재하지 않습니다."));
		
		return PaymentDTO.builder()
				.paymentId(entity.getPaymentId())
				.reservationId(entity.getReservationId())
				.paymentMethod(entity.getPaymentMethod())
				.amount(entity.getAmount())
				.status(entity.getStatus())
				.depositorName(entity.getDepositorName())
				.kakaoTid(entity.getKakaoTid())
				.paidAt(entity.getPaidAt())
				.createdAt(entity.getCreatedAt())
				.build();
	}
	
	/**
	 * 결제 생성
	 * @param dto
	 * @return
	 */
	public PaymentDTO reserved(PaymentDTO dto) {
			
			PaymentEntity entity = PaymentEntity.builder()
					.reservationId(dto.getReservationId())
					.paymentMethod(dto.getPaymentMethod())
					.amount(dto.getAmount())
					.status(PaymentEntity.Status.완료)
					.depositorName(dto.getDepositorName())
					.kakaoTid(dto.getKakaoTid())
					.build();
			
			PaymentEntity saved = pr.save(entity);
			
			return PaymentDTO.builder()
					.paymentId(saved.getPaymentId())
					.reservationId(dto.getReservationId())
					.paymentMethod(dto.getPaymentMethod())
					.amount(dto.getAmount())
					.status(PaymentEntity.Status.완료)   // 실제 Enum에 있는 값으로
					.depositorName(dto.getDepositorName())
					.kakaoTid(dto.getKakaoTid())
					.build();
		}
		public PaymentDTO findByReservationId(Long reservationId){
			PaymentEntity entity = pr.findByReservationId(reservationId).orElseThrow(()-> new EntityNotFoundException("해당된 예약 정보가 없습니다."));

			return PaymentDTO.builder()
					.paymentId(entity.getPaymentId())
					.reservationId(entity.getReservationId())
					.paymentMethod(entity.getPaymentMethod())
					.amount(entity.getAmount())
					.status(entity.getStatus())
					.depositorName(entity.getDepositorName())
					.kakaoTid(entity.getKakaoTid())
					.build();
		}

		/**
		 * 카카오페이 결제 준비. 이 예약에 대한 결제 행을 대기 상태로 만들어두고(재시도 시 기존 행 재사용),
		 * 카카오에 ready 요청을 보내 사용자를 보낼 결제 페이지 URL을 돌려준다.
		 */
		public String readyKakaoPayment(Long reservationId, int amount, String itemName) {
			PaymentEntity payment = pr.findByReservationId(reservationId).orElse(null);
			if (payment != null && payment.getStatus() == PaymentEntity.Status.완료) {
				throw new IllegalStateException("이미 결제가 완료된 예약입니다.");
			}
			String loginId = reservationService.getInfo(reservationId).getLoginId();

			String approvalUrl = callbackBase + "/payments/kakao/approve?reservationId=" + reservationId;
			String cancelUrl = callbackBase + "/payments/kakao/cancel?reservationId=" + reservationId;
			String failUrl = callbackBase + "/payments/kakao/fail?reservationId=" + reservationId;

			Map<String, Object> ready = kakaoPayService.ready(
					String.valueOf(reservationId), loginId, itemName, 1, amount,
					approvalUrl, cancelUrl, failUrl
			);
			String tid = (String) ready.get("tid");
			String redirectUrl = (String) ready.get("next_redirect_pc_url");

			if (payment == null) {
				payment = PaymentEntity.builder()
						.reservationId(reservationId)
						.paymentMethod(PaymentEntity.PaymentMethod.카카오페이)
						.amount(amount)
						.status(PaymentEntity.Status.대기)
						.build();
			}
			payment.setAmount(amount);
			payment.setKakaoTid(tid);
			pr.save(payment);

			return redirectUrl;
		}

		/**
		 * 카카오페이 결제 승인. approval_url로 리다이렉트되어 돌아왔을 때 호출 - 성공하면 결제를 완료
		 * 처리하고, 카카오 쪽 승인 자체가 실패하면(네트워크 오류 등) 예약을 자동 취소해서 자리를 비워준다.
		 */
		public void approveKakaoPayment(Long reservationId, String pgToken) {
			PaymentEntity payment = pr.findByReservationId(reservationId)
					.orElseThrow(() -> new EntityNotFoundException("결제 준비 내역이 없습니다: " + reservationId));
			TempleStayReservationDTO reservation = reservationService.getInfo(reservationId);

			try {
				kakaoPayService.approve(payment.getKakaoTid(), String.valueOf(reservationId), reservation.getLoginId(), pgToken);
			} catch (Exception e) {
				log.warn("카카오페이 승인 실패 reservationId={}", reservationId, e);
				reservationService.cancelUnpaid(reservationId);
				throw new IllegalStateException("결제 승인에 실패했습니다.");
			}

			payment.setStatus(PaymentEntity.Status.완료);
			payment.setPaidAt(LocalDateTime.now());
			pr.save(payment);
		}
	}