package com.hub.reservehub.common.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores an uploaded file on local disk under dir and removes it again if the surrounding DB transaction rolls back.
 * 업로드 파일을 로컬 디스크(dir 아래)에 저장하고, 감싼 DB 트랜잭션이 롤백되면 다시 지운다.
 * 업무 요청 첨부와 플랫폼 개설 신청(사업자등록증)이 함께 쓴다.
 */
public final class UploadedFiles {

    private UploadedFiles() {
    }

    // 저장된 파일 경로를 반환한다. 파일명 앞에 UUID를 붙여 같은 이름끼리 덮어쓰지 않는다.
    public static Path store(Path dir, MultipartFile file) {
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(UUID.randomUUID() + "_" + sanitizeFilename(file.getOriginalFilename()));
            file.transferTo(target);
            deleteOnRollback(target);
            return target;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded file", e);
        }
    }

    // 파일은 DB 커밋 전에 디스크에 써지므로, 저장이 롤백되면 주인 없는 파일이 남는다 — 롤백 시 지운다.
    private static void deleteOnRollback(Path file) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException ignored) {
                        // 정리 실패는 요청 결과를 바꾸지 않는다 — 파일 하나가 남을 뿐이다.
                    }
                }
            }
        });
    }

    // ponytail: 특수문자를 지워 경로 조작(../, 널바이트 등)을 막는 최소한의 검증. 바이러스 스캔은 아직 없음 —
    // 실제 첨부 사용량이 늘면 추가.
    static String sanitizeFilename(@Nullable String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "file";
        }
        String base = Path.of(originalName).getFileName().toString();
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
