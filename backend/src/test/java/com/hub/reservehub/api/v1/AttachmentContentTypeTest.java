package com.hub.reservehub.api.v1;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AttachmentContentTypeTest {

    @Test
    void scriptableTypesAreServedAsBinary() {
        // 업로더가 지정한 타입 그대로 내려주면 같은 오리진에서 스크립트가 돈다
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("text/html"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("image/svg+xml"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("application/xhtml+xml"));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("TEXT/HTML; charset=utf-8"));
    }

    @Test
    void brokenOrMissingTypeIsBinary() {
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType(null));
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("not a type"));
    }

    @Test
    void safePreviewTypesPassThroughWithoutParameters() {
        assertEquals(MediaType.IMAGE_PNG, WorkRequestCommentController.safeContentType("image/png"));
        assertEquals(MediaType.APPLICATION_PDF, WorkRequestCommentController.safeContentType("application/pdf"));
        assertEquals(MediaType.TEXT_PLAIN, WorkRequestCommentController.safeContentType("text/plain; charset=utf-8"));
        // 파싱 자체가 안 되는 charset은 깨진 값과 같이 바이너리로
        assertEquals(MediaType.APPLICATION_OCTET_STREAM, WorkRequestCommentController.safeContentType("text/plain; charset=evil"));
    }
}
