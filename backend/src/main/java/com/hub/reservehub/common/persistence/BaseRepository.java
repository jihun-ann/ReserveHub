package com.hub.reservehub.common.persistence;

import com.hub.reservehub.common.exception.NotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

// "id로 찾고 없으면 404"를 한곳에 — 서비스마다 findById().orElseThrow(...)를 반복하지 않게 한다.
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    default T getOrThrow(ID id) {
        return findById(id).orElseThrow(NotFoundException::new);
    }
}
