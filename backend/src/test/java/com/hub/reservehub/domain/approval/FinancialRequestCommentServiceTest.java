package com.hub.reservehub.domain.approval;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class FinancialRequestCommentServiceTest {

    @Test
    void blankContentAndNoFileIsNotUsable() {
        assertFalse(FinancialRequestCommentService.hasUsableContent("   ", null));
    }

    @Test
    void nonBlankContentAloneIsUsable() {
        assertTrue(FinancialRequestCommentService.hasUsableContent("자료 확인했습니다", null));
    }

    @Test
    void nonEmptyFileAloneIsUsable() {
        MultipartFile file = new MockMultipartFile("file", "receipt.pdf", "application/pdf", new byte[]{1, 2, 3});
        assertTrue(FinancialRequestCommentService.hasUsableContent(null, file));
    }

    @Test
    void emptyFileWithoutContentIsNotUsable() {
        MultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertFalse(FinancialRequestCommentService.hasUsableContent(null, file));
    }
}
