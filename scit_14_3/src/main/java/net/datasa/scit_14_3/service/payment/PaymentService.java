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
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {
	private final PaymentRepository pr;
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
	}