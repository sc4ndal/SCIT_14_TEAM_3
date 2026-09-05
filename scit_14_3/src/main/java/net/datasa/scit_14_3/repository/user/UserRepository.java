package net.datasa.scit_14_3.repository.user;

import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    // PK가 login_id(String)라 findById(String)로 바로 조회 가능
    boolean existsByNickname(String nickname);
    boolean existsByEmail(String email);
    Optional<UserEntity> findByEmail(String email);
}
