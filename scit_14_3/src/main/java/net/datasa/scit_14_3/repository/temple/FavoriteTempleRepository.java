package net.datasa.scit_14_3.repository.temple;
import net.datasa.scit_14_3.domain.entity.FavoriteTempleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoriteTempleRepository extends JpaRepository<FavoriteTempleEntity, Long> {
}