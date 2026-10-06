package net.datasa.scit_14_3.repository.user;

import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    // PK가 login_id(String)라 findById(String)로 바로 조회 가능
    boolean existsByNickname(String nickname);
    boolean existsByEmail(String email);
    Optional<UserEntity> findByEmail(String email);

    // 탈퇴 유예기간이 끝난(신청일이 cutoff 이전) 회원 중 아직 확정 처리 안 된 것들 - WithdrawalScheduler가 매일 조회
    List<UserEntity> findByWithdrawalRequestedAtLessThanEqualAndWithdrawnAtIsNull(LocalDateTime cutoff);

    // 예전 방식(익명화만 하고 행을 남김)으로 처리된 탈퇴 회원 - 탈퇴 확정 배치가 삭제로 정리한다(전용 "탈퇴한 회원" 계정도 포함되니 호출부에서 거른다)
    List<UserEntity> findByWithdrawnAtIsNotNull();
}
