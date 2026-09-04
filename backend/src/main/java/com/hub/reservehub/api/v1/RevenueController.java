package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.pass.CashReceiptStatus;
import com.hub.reservehub.domain.pass.OrderStatus;
import com.hub.reservehub.domain.pass.PaymentMethod;
import com.hub.reservehub.domain.pass.RevenueService;
import com.hub.reservehub.domain.pass.TaxType;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class RevenueController {

    private final RevenueService revenueService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public RevenueController(RevenueService revenueService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.revenueService = revenueService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @GetMapping("/api/v1/platforms/{platformId}/revenue/records")
    public List<RevenueRecordResponse> records(
            @PathVariable UUID platformId, @RequestParam int year, @RequestParam int month,
            @RequestParam(defaultValue = "true") boolean includeTax
    ) {
        return revenueService.listRecords(platformId, currentAuthenticatedUser.get(), year, month, includeTax).stream()
                .map(RevenueRecordResponse::from)
                .toList();
    }

    @GetMapping("/api/v1/platforms/{platformId}/revenue/summary")
    public RevenueSummaryResponse summary(
            @PathVariable UUID platformId, @RequestParam int year, @RequestParam int month,
            @RequestParam(defaultValue = "true") boolean includeTax
    ) {
        return RevenueSummaryResponse.from(
                revenueService.summary(platformId, currentAuthenticatedUser.get(), year, month, includeTax)
        );
    }

    public record RevenueRecordResponse(
            UUID orderId, UUID orderItemId,
            UUID studentId, String studentName,
            String guardianName, String guardianPhone,
            UUID programId, String programName,
            LocalDate enrollStart, LocalDate enrollEnd,
            int billedAmount, int discountAmount, int paidAmount, Instant paidAt,
            PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, String receiptNumber,
            OrderStatus status, int refundAmount, Instant refundedAt, TaxType taxType
    ) {
        static RevenueRecordResponse from(RevenueService.RevenueRecord r) {
            return new RevenueRecordResponse(
                    r.orderId(), r.orderItemId(), r.studentId(), r.studentName(),
                    r.guardianName(), r.guardianPhone(), r.programId(), r.programName(),
                    r.enrollStart(), r.enrollEnd(), r.billedAmount(), r.discountAmount(), r.paidAmount(), r.paidAt(),
                    r.paymentMethod(), r.cashReceiptStatus(), r.receiptNumber(),
                    r.status(), r.refundAmount(), r.refundedAt(), r.taxType()
            );
        }
    }

    public record RevenueSummaryResponse(
            int totalBilled, int totalCollected, int cardAmount, int bankTransferAmount, int cashAmount,
            int cashReceiptAmount, int refundAmount, int outstandingAmount, int netRevenue
    ) {
        static RevenueSummaryResponse from(RevenueService.RevenueSummary s) {
            return new RevenueSummaryResponse(
                    s.totalBilled(), s.totalCollected(), s.cardAmount(), s.bankTransferAmount(), s.cashAmount(),
                    s.cashReceiptAmount(), s.refundAmount(), s.outstandingAmount(), s.netRevenue()
            );
        }
    }
}
