package com.hub.reservehub.domain.approval;

import com.hub.reservehub.domain.user.User;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.lang.Nullable;

/**
 * 활동 이력(ActionLog)의 메모 문장을 만드는 도구 — "무엇을 어떻게 바꿨는지"가 이력만 봐도 드러나게 한다.
 */
public final class LogMemo {

    private LogMemo() {
    }

    // 작업 요약 뒤에 처리자가 직접 적은 메모가 있으면 이어 붙인다.
    public static String with(String summary, @Nullable String note) {
        return note == null || note.isBlank() ? summary : summary + " / 메모: " + clip(note, 200);
    }

    public static String clip(@Nullable String text, int max) {
        if (text == null) {
            return "";
        }
        String t = text.strip();
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    // 값이 바뀐 항목만 "이름: 이전 → 이후"로 만든다. 같으면 null.
    @Nullable
    public static String change(String label, @Nullable Object before, @Nullable Object after) {
        if (Objects.equals(before, after)) {
            return null;
        }
        return label + ": " + show(before) + " → " + show(after);
    }

    // change()들의 결과를 쉼표로 잇는다. 바뀐 게 없으면 "변경된 항목 없음".
    public static String changes(@Nullable String... parts) {
        String joined = Stream.of(parts).filter(Objects::nonNull).collect(Collectors.joining(", "));
        return joined.isEmpty() ? "변경된 항목 없음" : joined;
    }

    public static String who(@Nullable User user) {
        return user == null ? "(알 수 없음)" : user.getName() + "(" + user.getEmail() + ")";
    }

    public static String won(long amount) {
        return String.format("%,d원", amount);
    }

    private static String show(@Nullable Object value) {
        return value == null || value.toString().isBlank() ? "없음" : value.toString();
    }
}
