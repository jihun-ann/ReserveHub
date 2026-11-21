package com.hub.reservehub.common.persistence;

import com.hub.reservehub.common.exception.NotFoundException;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

// "id로 찾고 없으면 404"를 한곳에 — 서비스마다 findById().orElseThrow(...)를 반복하지 않게 한다.
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    default T getOrThrow(ID id) {
        return findById(id).orElseThrow(NotFoundException::new);
    }

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from #{#entityName} e where e.id = :id")
    Optional<T> findByIdForUpdate(@Param("id") ID id);

    // SELECT ... FOR UPDATE — 트랜잭션이 끝날 때까지 같은 행을 잡으려는 다른 요청을 기다리게 한다.
    // "읽고 → 검사하고 → 쓰는" 흐름(결제 확정, 정원 확인 후 예약, 잔여 횟수 차감)이 동시에 두 번 통과하지 않게 할 때 쓴다.
    default T getForUpdate(ID id) {
        return findByIdForUpdate(id).orElseThrow(NotFoundException::new);
    }
}
