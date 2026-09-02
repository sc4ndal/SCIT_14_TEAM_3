package net.datasa.scit_14_3.security;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.domain.entity.temple.TempleEntity;
import net.datasa.scit_14_3.domain.entity.user.UserEntity;
import net.datasa.scit_14_3.repository.temple.TempleRepository;
import net.datasa.scit_14_3.repository.user.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * login_id 첫 글자가 '@'면 TEMPLE 계정, 아니면 USER 계정으로 보고 조회합니다.
 *
 * 주의: TempleEntity/TempleRepository는 이 파일에서 새로 만들지 않고, 팀에서 이미 만들어둔
 * net.datasa.scit_14_3.domain.entity.TempleEntity / net.datasa.scit_14_3.repository.TempleRepository를
 * 그대로 가져다 씁니다. TempleRepository.findByLoginId()가 Optional<TempleEntity>를 반환하도록
 * 되어 있어야 합니다(예전에 ScopedValue로 잘못 선언됐던 부분, 이미 고치셨을 거예요).
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final TempleRepository templeRepository;

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        if (loginId != null && loginId.startsWith("@")) {
            TempleEntity temple = templeRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new UsernameNotFoundException("사찰 계정을 찾을 수 없습니다: " + loginId));
            return new AppUserDetails(
                    temple.getLoginId(),
                    temple.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_TEMPLE")),
                    temple.getTempleId(),
                    temple.getName(),
                    null, // 폼로그인이라 카카오 토큰 없음
                    temple.isMustChangePassword()
            );
        }

        UserEntity user = userRepository.findById(loginId)
                .orElseThrow(() -> new UsernameNotFoundException("회원을 찾을 수 없습니다: " + loginId));
        String roleName = "ROLE_" + user.getRole().name(); // ROLE_USER 또는 ROLE_ADMIN
        return new AppUserDetails(
                user.getLoginId(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(roleName)),
                null,
                user.getNickname(),
                null, // 폼로그인이라 카카오 토큰 없음
                false
        );
    }
}
