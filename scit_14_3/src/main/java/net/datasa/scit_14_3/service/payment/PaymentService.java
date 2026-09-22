package net.datasa.scit_14_3.service.payment;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.domain.dto.payment.PaymentDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayProgramDTO;
import net.datasa.scit_14_3.domain.dto.templestay.TempleStayReservationDTO;
import net.datasa.scit_14_3.domain.entity.payment.PaymentEntity;
import net.datasa.scit_14_3.domain.entity.templestay.ReservationParticipantEntity;
import net.datasa.scit_14_3.repository.payment.PaymentRepository;
import net.datasa.scit_14_3.repository.templestay.ReservationParticipantRepository;
import net.datasa.scit_14_3.service.templestay.TempleStayProgramService;
import net.datasa.scit_14_3.service.templestay.TempleStayReservationService;
import net.datasa.scit_14_3.service.user.EmailVerificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {
	private final PaymentRepository pr;
	private final KakaoPayService kakaoPayService;
	private final TempleStayReservationService reservationService;
	private final TempleStayProgramService programService;
	private final ReservationParticipantRepository rpr;
	private final EmailVerificationService emailVerificationService;

	@Value("${kakaopay.callback-base}")
	private String callbackBase;
	/**
	 * 결제 생성 - 이 메서드는 계좌이체(무통장입금) 전용이다(카카오페이는 readyKakaoPayment/
	 * approveKakaoPayment 별도 흐름). 실제 입금 여부는 시스템이 확인할 수 없어서 결제 행 자체는
	 * 완료로 저장하되(입금했다는 사용자 주장을 그대로 기록), 예약은 예약대기로 내려서 사찰이
	 * 입금을 눈으로 확인하고 확정 처리하게 한다.
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
			reservationService.markPendingBankTransfer(dto.getReservationId());
			sendPendingEmail(dto.getReservationId(), dto.getAmount(), dto.getPaymentMethod().toString());

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

			return toDto(entity);
		}

		/** 예약목록 화면 전용 - 예약 ID 여러 개의 결제 정보를 한 번에 조회. 결제 안 한(대기 등) 예약은
		    결과 맵에 아예 없으니 호출부에서 get()이 null일 수 있음을 감안해야 한다. */
		public java.util.Map<Long, PaymentDTO> findByReservationIds(java.util.List<Long> reservationIds) {
			return pr.findByReservationIdIn(reservationIds).stream()
					.collect(java.util.stream.Collectors.toMap(PaymentEntity::getReservationId, this::toDto));
		}

		/** 계좌이체 입금확인 3일 자동취소 배치(TempleStayReservationScheduler)에서 호출.
		    예약대기 상태로 3일 넘은 예약들을 취소시킨 뒤, 그 예약들의 결제 행도 같이 취소 처리한다
		    (사용자가 입금했다고 기록해뒀던 완료 상태를 그대로 두면 취소된 예약에 완료된 결제가
		    남아서 앞뒤가 안 맞는다). */
		public int cancelStalePendingBankTransfers(int graceDays) {
			List<Long> canceledReservationIds = reservationService.findAndCancelStalePendingReservations(graceDays);
			if (canceledReservationIds.isEmpty()) {
				return 0;
			}
			for (PaymentEntity payment : pr.findByReservationIdIn(canceledReservationIds)) {
				payment.setStatus(PaymentEntity.Status.취소);
			}
			canceledReservationIds.forEach(this::notifyReservationCanceled);
			log.info("계좌이체 입금확인 {}일 초과로 {}건 자동취소함", graceDays, canceledReservationIds.size());
			return canceledReservationIds.size();
		}

		/** 예약 취소 안내 메일 - 본인 취소(ReservationController.canceledReservation), 사찰 관리자
		    취소(TempleProgramManageController.cancelReservation), 입금확인 3일 초과 자동취소
		    (위 cancelStalePendingBankTransfers) 전부 여기서 보낸다. */
		public void notifyReservationCanceled(Long reservationId) {
			try {
				TempleStayReservationDTO reservation = reservationService.getInfo(reservationId);
				TempleStayProgramDTO program = programService.getInfo(reservation.getProgramId());
				ReservationParticipantEntity representative = rpr.findFirstByReservationIdOrderByParticipantIdAsc(reservationId)
						.orElse(null);
				if (representative == null || representative.getEmail() == null) {
					log.warn("예약 취소 메일 발송 건너뜀(대표자 이메일 없음) reservationId={}", reservationId);
					return;
				}
				emailVerificationService.sendReservationCanceledNotice(
						representative.getEmail(), reservation.getLang(), reservationId, program.getTitle(), program.getTempleName(),
						reservation.getStartDate(), reservation.getEndDate()
				);
			} catch (Exception e) {
				log.warn("예약 취소 메일 발송 실패 reservationId={}", reservationId, e);
			}
		}

		private PaymentDTO toDto(PaymentEntity entity) {
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
			sendReceiptEmail(reservationId, payment.getAmount(), payment.getPaymentMethod().toString());
		}

		/** 사찰이 계좌이체 입금을 확인해서 예약대기 -> 예약확정으로 바뀌었을 때 호출 - 이때야
		    비로소 "확정" 메일을 보낸다(TempleProgramManageController.confirmReservation 참고). */
		public void notifyBankTransferConfirmed(Long reservationId) {
			PaymentEntity payment = pr.findByReservationId(reservationId)
					.orElseThrow(() -> new EntityNotFoundException("해당된 예약 정보가 없습니다."));
			sendReceiptEmail(reservationId, payment.getAmount(), payment.getPaymentMethod().toString());
		}

		/** 예약 확정(결제 완료) 안내 메일. 카카오페이는 결제 승인 즉시, 계좌이체는 사찰이 입금을
		    확인해서 확정 처리한 시점에 보낸다. */
		private void sendReceiptEmail(Long reservationId, int amount, String paymentMethod) {
			sendReservationEmail(reservationId, amount, paymentMethod, false);
		}

		/** 계좌이체 신청 접수 직후(아직 예약대기, 입금확인 전) 보내는 안내 메일. */
		private void sendPendingEmail(Long reservationId, int amount, String paymentMethod) {
			sendReservationEmail(reservationId, amount, paymentMethod, true);
		}

		/** sendReceiptEmail/sendPendingEmail의 공통 로직 - 대표자(participants[0]) 앞으로
		    보내며, 메일 발송 실패는 예약/결제 자체를 실패시키지 않도록 여기서 잡아서 로그만 남긴다. */
		private void sendReservationEmail(Long reservationId, int amount, String paymentMethod, boolean pending) {
			try {
				TempleStayReservationDTO reservation = reservationService.getInfo(reservationId);
				TempleStayProgramDTO program = programService.getInfo(reservation.getProgramId());
				ReservationParticipantEntity representative = rpr.findFirstByReservationIdOrderByParticipantIdAsc(reservationId)
						.orElse(null);
				if (representative == null || representative.getEmail() == null) {
					log.warn("예약 안내 메일 발송 건너뜀(대표자 이메일 없음) reservationId={}", reservationId);
					return;
				}
				if (pending) {
					emailVerificationService.sendReservationPendingNotice(
							representative.getEmail(), reservation.getLang(), reservationId, program.getTitle(), program.getTempleName(),
							program.getTempleAddress(), reservation.getStartDate(), reservation.getEndDate(),
							reservation.getParticipantCount(), amount, paymentMethod,
							representative.getName(), representative.getPhone(),
							program.getLatitude(), program.getLongitude()
					);
				} else {
					emailVerificationService.sendReservationReceipt(
							representative.getEmail(), reservation.getLang(), reservationId, program.getTitle(), program.getTempleName(),
							program.getTempleAddress(), reservation.getStartDate(), reservation.getEndDate(),
							reservation.getParticipantCount(), amount, paymentMethod,
							representative.getName(), representative.getPhone(),
							program.getLatitude(), program.getLongitude()
					);
				}
			} catch (Exception e) {
				log.warn("예약 안내 메일 발송 실패 reservationId={}", reservationId, e);
			}
		}
	}