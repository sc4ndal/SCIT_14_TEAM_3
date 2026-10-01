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
	private final TossPayService tossPayService;
	private final TempleStayReservationService reservationService;
	private final TempleStayProgramService programService;
	private final ReservationParticipantRepository rpr;
	private final EmailVerificationService emailVerificationService;

	/** 토스 confirm() 응답의 card.issuerCode(카드사 두 자리 코드) -> 한글 카드사명.
	    https://docs.tosspayments.com/codes/org-codes 의 "카드사 코드" 표 그대로. */
	private static final Map<String, String> CARD_ISSUER_NAMES = Map.ofEntries(
			Map.entry("3K", "기업BC"), Map.entry("46", "광주카드"), Map.entry("71", "롯데카드"),
			Map.entry("30", "KDB산업은행"), Map.entry("31", "BC카드"), Map.entry("51", "삼성카드"),
			Map.entry("38", "새마을금고"), Map.entry("41", "신한카드"), Map.entry("62", "신협"),
			Map.entry("36", "씨티카드"), Map.entry("33", "우리BC카드"), Map.entry("W1", "우리카드"),
			Map.entry("37", "우체국예금보험"), Map.entry("39", "저축은행중앙회"), Map.entry("35", "전북은행"),
			Map.entry("42", "제주은행"), Map.entry("15", "카카오뱅크"), Map.entry("3A", "케이뱅크"),
			Map.entry("24", "토스뱅크"), Map.entry("21", "하나카드"), Map.entry("61", "현대카드"),
			Map.entry("11", "KB국민카드"), Map.entry("91", "NH농협카드"), Map.entry("34", "Sh수협은행"),
			Map.entry("6D", "다이너스클럽"), Map.entry("4M", "마스터카드"), Map.entry("3C", "유니온페이"),
			Map.entry("7A", "아메리칸익스프레스"), Map.entry("4J", "JCB"), Map.entry("4V", "VISA")
	);

	/**
	 * 결제 생성 - 이 메서드는 계좌이체(무통장입금) 전용이다(카드결제는 readyTossPayment/
	 * confirmTossPayment 별도 흐름). 실제 입금 여부는 시스템이 확인할 수 없어서 결제 행 자체는
	 * 완료로 저장하되(입금했다는 사용자 주장을 그대로 기록), 예약은 예약대기로 내려서 사찰이
	 * 입금을 눈으로 확인하고 확정 처리하게 한다.
	 * @param dto
	 * @return
	 */
	public PaymentDTO reserved(PaymentDTO dto) {
			// 참가비 0원(무료 프로그램)이면 실제로 주고받는 돈이 없어서 입금 확인 과정 자체가
			// 의미 없다 - 다만 결제수단은 사용자가 고른 값(계좌이체/카드) 그대로 정확히 저장한다.
			// CHECK 제약(chk_payment_method_fields)이 완료 상태면 계좌이체는 depositor_name,
			// 카드는 toss_payment_key가 NOT NULL이어야 해서, 실제 입금/결제가 없는 대신
			// placeholder 값으로 채워서 제약만 만족시킨다.
			boolean free = dto.getAmount() == 0;

			// JS 쪽 검증(reservation.js)을 우회해서 요청이 와도 빈 입금자명으로 저장되지 않게 서버에서도 막는다.
			// depositor_name 컬럼 자체는 NULL 허용이라(DB CHECK도 빈 문자열은 막지 못함) 여기서 확실히 걸러야 한다.
			if (!free && dto.getPaymentMethod() == PaymentEntity.PaymentMethod.계좌이체
					&& (dto.getDepositorName() == null || dto.getDepositorName().isBlank())) {
				throw new IllegalStateException("입금자명을 입력해 주세요.");
			}

			// 이전에 카드결제로 시도하다가 취소/방치돼 미완료(대기) 상태로 남은 행이 있으면
			// 재사용한다 - reservation_id가 UNIQUE라 무조건 새로 INSERT하면 그 행과 충돌한다.
			PaymentEntity existing = pr.findByReservationId(dto.getReservationId()).orElse(null);
			if (existing != null && existing.getStatus() == PaymentEntity.Status.완료) {
				throw new IllegalStateException("이미 결제가 완료된 예약입니다.");
			}
			PaymentEntity entity = (existing != null ? existing : new PaymentEntity());
			entity.setReservationId(dto.getReservationId());
			entity.setPaymentMethod(dto.getPaymentMethod());
			entity.setAmount(dto.getAmount());
			entity.setStatus(PaymentEntity.Status.완료);
			// 이 메서드로 카드가 들어오는 경우는 free뿐이다(non-free 카드는 토스 SDK가 여는
			// 결제창 -> confirmTossPayment() 경로로 가고 여긴 안 거침).
			if (dto.getPaymentMethod() == PaymentEntity.PaymentMethod.카드) {
				entity.setDepositorName(null);
				entity.setTossPaymentKey("FREE_0WON");
			} else {
				entity.setDepositorName(free ? "무료(0원)" : dto.getDepositorName());
				entity.setTossPaymentKey(null);
			}
			if (free) {
				entity.setPaidAt(LocalDateTime.now());
			}

			PaymentEntity saved = pr.save(entity);
			if (free) {
				// 입금 확인할 게 없으니 예약대기로 내리지 않고(기본값인 예약확정 그대로), 확정 메일을 바로 보낸다.
				sendReceiptEmail(dto.getReservationId(), dto.getAmount(), displayPaymentMethod(saved));
			} else {
				reservationService.markPendingBankTransfer(dto.getReservationId());
				sendPendingEmail(dto.getReservationId(), dto.getAmount(), dto.getPaymentMethod().toString());
			}

			return PaymentDTO.builder()
					.paymentId(saved.getPaymentId())
					.reservationId(dto.getReservationId())
					.paymentMethod(entity.getPaymentMethod())
					.amount(dto.getAmount())
					.status(PaymentEntity.Status.완료)   // 실제 Enum에 있는 값으로
					.depositorName(entity.getDepositorName())
					.paymentDetail(entity.getPaymentDetail())
					.paidAt(entity.getPaidAt())
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

		/** 카드결제 이탈(토스 결제창 띄워놓고 탭 닫기 등) 자동취소 배치(TempleStayReservationScheduler)에서
		    호출. 토스 결제 세션 자체가 30분 지나면 만료되니, graceMinutes를 그보다 짧게 잡으면
		    "아직 결제 진행 중인데 먼저 취소해버리는" 레이스컨디션이 생길 수 있어 주의해야 한다. */
		public int cancelStalePendingCardPayments(int graceMinutes) {
			LocalDateTime cutoff = LocalDateTime.now().minusMinutes(graceMinutes);
			List<PaymentEntity> stalePayments = pr.findByPaymentMethodAndStatusAndCreatedAtBefore(
					PaymentEntity.PaymentMethod.카드, PaymentEntity.Status.대기, cutoff);
			if (stalePayments.isEmpty()) {
				return 0;
			}
			for (PaymentEntity payment : stalePayments) {
				reservationService.cancelUnpaid(payment.getReservationId());
				payment.setStatus(PaymentEntity.Status.취소);
				notifyReservationCanceled(payment.getReservationId());
			}
			log.info("카드결제 {}분 초과 미완료로 {}건 자동취소함", graceMinutes, stalePayments.size());
			return stalePayments.size();
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
						representative.getEmail(), reservation.getLang(), reservationId, reservation.getProgramTitleSnapshot(), reservation.getTempleNameSnapshot(),
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
					.tossPaymentKey(entity.getTossPaymentKey())
					.paymentDetail(entity.getPaymentDetail())
					.paidAt(entity.getPaidAt())
					.build();
		}

		/** 토스페이먼츠 orderId 규칙(영문/숫자/-/_, 6~64자)에 맞춰 예약 ID 기준으로 만든다.
		    카카오페이의 partner_order_id와 같은 역할 - 예약 1건당 결제 1건이라 이걸로 충분히 고유하다. */
		public String buildTossOrderId(Long reservationId) {
			return "reservation-" + reservationId;
		}

		/**
		 * 토스페이먼츠 결제 준비. 토스는 카카오와 달리 결제창을 서버 API가 아니라 클라이언트 SDK가
		 * 직접 여니까 여기서 외부 API를 부를 필요는 없고, confirmTossPayment가 나중에 찾을 수 있게
		 * 결제 행을 대기 상태로 미리 만들어두고 orderId만 돌려준다.
		 */
		public String readyTossPayment(Long reservationId, int amount) {
			PaymentEntity payment = pr.findByReservationId(reservationId).orElse(null);
			if (payment != null && payment.getStatus() == PaymentEntity.Status.완료) {
				throw new IllegalStateException("이미 결제가 완료된 예약입니다.");
			}
			if (payment == null) {
				payment = PaymentEntity.builder()
						.reservationId(reservationId)
						.status(PaymentEntity.Status.대기)
						.build();
			}
			// 이전에 시도했다가 미완료로 남은 행을 재사용하는 경우 대비 - 방식/수단 전용 필드를 매번
			// 명시적으로 다시 세팅한다. 안 그러면 payment_method는 옛 값 그대로 남은 채 toss_payment_key만
			// 채워져서, 완료 처리 시 CHECK 제약과 어긋난다.
			payment.setPaymentMethod(PaymentEntity.PaymentMethod.카드);
			payment.setAmount(amount);
			payment.setDepositorName(null);
			pr.save(payment);
			return buildTossOrderId(reservationId);
		}

		/**
		 * 토스페이먼츠 결제 승인. 결제위젯에서 successUrl로 돌아왔을 때 호출 - 성공하면 결제를 완료
		 * 처리하고, 토스 쪽 승인 자체가 실패하면(네트워크 오류 등) 예약을 자동 취소해서 자리를 비워준다.
		 */
		public void confirmTossPayment(Long reservationId, String paymentKey, int amount) {
			PaymentEntity payment = pr.findByReservationId(reservationId)
					.orElseThrow(() -> new EntityNotFoundException("결제 준비 내역이 없습니다: " + reservationId));

			Map<String, Object> result;
			try {
				result = tossPayService.confirm(paymentKey, buildTossOrderId(reservationId), amount);
			} catch (Exception e) {
				log.warn("토스페이 승인 실패 reservationId={}", reservationId, e);
				reservationService.cancelUnpaid(reservationId);
				throw new IllegalStateException("결제 승인에 실패했습니다.");
			}

			payment.setTossPaymentKey(paymentKey);
			payment.setPaymentDetail(extractPaymentDetail(result));
			payment.setStatus(PaymentEntity.Status.완료);
			payment.setPaidAt(LocalDateTime.now());
			pr.save(payment);
			sendReceiptEmail(reservationId, payment.getAmount(), displayPaymentMethod(payment));
		}

		/** 메일/화면에 보여줄 결제수단 - payment_detail(카드결제는 토스에서 받은 실제 카드사/간편결제사명,
		    무료 예약은 "무료")이 있으면 그걸, 없으면 enum 이름("카드"/"계좌이체") 그대로 보여준다.
		    무료(0원) 예약은 CHECK 제약 때문에 내부적으로 payment_method를 계좌이체로 저장하지만
		    (reserved() 참고) 결제수단 선택과 무관하므로 "계좌이체"로 보이면 안 되고 payment_detail로 덮는다. */
		private String displayPaymentMethod(PaymentEntity payment) {
			if (payment.getPaymentDetail() != null) {
				return payment.getPaymentDetail();
			}
			return payment.getPaymentMethod().toString();
		}

		/** 토스 confirm() 응답에서 실제 결제수단을 뽑는다. 최상위 method 필드는 "카드"/"간편결제"
		    같은 대분류만 주고 실제 카드사/간편결제사명은 안 담겨 있어서(토스 공식 문서 확인함),
		    간편결제면 easyPay.provider(한글명 그대로 내려옴), 카드면 card.issuerCode(두 자리 코드 ->
		    CARD_ISSUER_NAMES로 변환)를 따로 봐야 한다. 둘 다 없으면(응답 형식이 달라진 경우)
		    method 대분류라도 보여주고, 결제 자체는 이미 완료된 상태라 실패시키지 않는다. */
		private String extractPaymentDetail(Map<String, Object> confirmResult) {
			Object easyPay = confirmResult.get("easyPay");
			if (easyPay instanceof Map<?, ?> easyPayMap && easyPayMap.get("provider") != null) {
				return String.valueOf(easyPayMap.get("provider"));
			}
			Object card = confirmResult.get("card");
			if (card instanceof Map<?, ?> cardMap && cardMap.get("issuerCode") != null) {
				String issuerCode = String.valueOf(cardMap.get("issuerCode"));
				return CARD_ISSUER_NAMES.getOrDefault(issuerCode, issuerCode);
			}
			Object method = confirmResult.get("method");
			return method != null ? String.valueOf(method) : null;
		}

		/** 사찰이 계좌이체 입금을 확인해서 예약대기 -> 예약확정으로 바뀌었을 때 호출 - 이때야
		    비로소 "확정" 메일을 보낸다(TempleProgramManageController.confirmReservation 참고).
		    카드결제는 confirmTossPayment에서 승인 즉시 paid_at을 채우는데, 계좌이체는 입금 확인
		    자체가 비동기(사찰이 나중에 확인)라 그동안 비어있다가 여기서야 비로소 채워진다. */
		public void notifyBankTransferConfirmed(Long reservationId) {
			PaymentEntity payment = pr.findByReservationId(reservationId)
					.orElseThrow(() -> new EntityNotFoundException("해당된 예약 정보가 없습니다."));
			payment.setPaidAt(LocalDateTime.now());
			pr.save(payment);
			sendReceiptEmail(reservationId, payment.getAmount(), displayPaymentMethod(payment));
		}

		/** 예약 확정(결제 완료) 안내 메일. 카드결제는 결제 승인 즉시, 계좌이체는 사찰이 입금을
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
							representative.getEmail(), reservation.getLang(), reservationId, reservation.getProgramTitleSnapshot(), reservation.getTempleNameSnapshot(),
							program.getTempleAddress(), reservation.getStartDate(), reservation.getEndDate(),
							reservation.getParticipantCount(), amount, paymentMethod,
							representative.getName(), representative.getPhone(),
							program.getLatitude(), program.getLongitude()
					);
				} else {
					emailVerificationService.sendReservationReceipt(
							representative.getEmail(), reservation.getLang(), reservationId, reservation.getProgramTitleSnapshot(), reservation.getTempleNameSnapshot(),
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