package com.hub.reservehub.common.persistence;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

// findAllById 결과처럼 한 번에 읽어온 행들을 id로 찾기 쉽게 Map으로 — 목록 화면의 N+1 조회를 피할 때 쓴다.
public final class Lookups {

    private Lookups() {
    }

    public static <T> Map<UUID, T> byId(Iterable<T> rows, Function<T, UUID> idOf) {
        Map<UUID, T> result = new HashMap<>();
        rows.forEach(row -> result.put(idOf.apply(row), row));
        return result;
    }
}
