package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.program.Program;
import com.hub.reservehub.domain.program.ProgramRepository;
import com.hub.reservehub.domain.user.User;
import com.hub.reservehub.domain.user.UserRepository;
import com.hub.reservehub.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 학생별 결제 상세 내역과 월별 매출 집계 — 세무사/오너/매니저 전용 (AGENT.md 재무 접근 가드 재사용).
 * 주문(Order) 단위 금액을 항목(OrderItem)의 lineTotal 비율로 배분해 항목별 청구/할인/수납/환불액을 계산한다.
 * 세액 포함/미포함 토글은 항목별 TaxType(과세/면세)에 따라 과세 항목만 부가세(÷1.1)를 제외해서 보여준다.
 */
@Service
public class RevenueService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProgramRepository programRepository;
    private final PlatformAccessGuard platformAccessGuard;

    public RevenueService(
            OrderRepository orderRepository, OrderItemRepository orderItemRepository,
            UserRepository userRepository, ProgramRepository programRepository,
            PlatformAccessGuard platformAccessGuard
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.programRepository = programRepository;
        this.platformAccessGuard = platformAccessGuard;
    }

    @Transactional(readOnly = true)
    public List<RevenueRecord> listRecords(UUID platformId, AuthenticatedUser actor, int year, int month, boolean includeTax) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        List<Order> orders = ordersForMonth(platformId, year, month);
        List<OrderItem> items = orderItemRepository.findByOrderIdIn(orders.stream().map(Order::getId).toList());

        Map<UUID, User> usersById = userRepository.findAllById(orders.stream().map(Order::getUserId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<UUID, Program> programsById = programRepository.findAllById(
                items.stream().map(OrderItem::getProgramId).filter(java.util.Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(Program::getId, Function.identity()));
        Map<UUID, Order> ordersById = orders.stream().collect(Collectors.toMap(Order::getId, Function.identity()));

        List<RevenueRecord> records = new ArrayList<>();
        for (OrderItem item : items) {
            Order order = ordersById.get(item.getOrderId());
            if (order == null) {
                continue;
            }
            User student = usersById.get(order.getUserId());
            Program program = item.getProgramId() != null ? programsById.get(item.getProgramId()) : null;
            double ratio = order.getOriginalAmount() > 0 ? (double) item.getLineTotal() / order.getOriginalAmount() : 0;

            int billed = adjust(item.getLineTotal(), item.getTaxType(), includeTax);
            int discount = adjust(allocate(order.getDiscountAmount(), ratio), item.getTaxType(), includeTax);
            int paid = adjust(allocate(order.getPaidAmount(), ratio), item.getTaxType(), includeTax);
            int refund = adjust(allocate(order.getRefundAmount(), ratio), item.getTaxType(), includeTax);

            records.add(new RevenueRecord(
                    order.getId(), item.getId(),
                    order.getUserId(), student != null ? student.getName() : "-",
                    student != null ? student.getGuardianName() : null, student != null ? student.getGuardianPhone() : null,
                    item.getProgramId(), program != null ? program.getName() : null,
                    item.getEnrollStart(), item.getEnrollEnd(),
                    billed, discount, paid, order.getPaidAt(),
                    order.getPaymentMethod(), order.getCashReceiptStatus(), order.getReceiptNumber(),
                    order.getStatus(), refund, order.getRefundedAt(), item.getTaxType()
            ));
        }
        return records;
    }

    @Transactional(readOnly = true)
    public RevenueSummary summary(UUID platformId, AuthenticatedUser actor, int year, int month, boolean includeTax) {
        List<RevenueRecord> records = listRecords(platformId, actor, year, month, includeTax);

        int totalBilled = 0;
        int totalCollected = 0;
        int totalDiscount = 0;
        int card = 0;
        int bankTransfer = 0;
        int cash = 0;
        int cashReceipt = 0;
        int refund = 0;
        for (RevenueRecord r : records) {
            totalBilled += r.billedAmount();
            totalDiscount += r.discountAmount();
            totalCollected += r.paidAmount();
            refund += r.refundAmount();
            if (r.paymentMethod() == PaymentMethod.CARD) {
                card += r.paidAmount();
            } else if (r.paymentMethod() == PaymentMethod.BANK_TRANSFER) {
                bankTransfer += r.paidAmount();
            } else if (r.paymentMethod() == PaymentMethod.CASH) {
                cash += r.paidAmount();
            }
            if (r.cashReceiptStatus() == CashReceiptStatus.ISSUED || r.cashReceiptStatus() == CashReceiptStatus.SELF_ISSUED) {
                cashReceipt += r.paidAmount();
            }
        }
        // 미수금 = 청구액에서 할인(=애초에 받을 필요 없는 돈)을 뺀 실제 청구잔액 중 아직 못 받은 부분.
        int outstanding = totalBilled - totalDiscount - totalCollected;
        int netRevenue = totalCollected - refund;
        return new RevenueSummary(totalBilled, totalCollected, card, bankTransfer, cash, cashReceipt, refund, outstanding, netRevenue);
    }

    private List<Order> ordersForMonth(UUID platformId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        Instant from = ym.atDay(1).atStartOfDay(ZONE).toInstant();
        Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant();
        return orderRepository.findByPlatformId(platformId).stream()
                .filter(o -> !o.getCreatedAt().isBefore(from) && o.getCreatedAt().isBefore(to))
                .toList();
    }

    private int allocate(int orderTotal, double ratio) {
        return (int) Math.round(orderTotal * ratio);
    }

    private int adjust(int amount, TaxType taxType, boolean includeTax) {
        if (includeTax || taxType != TaxType.TAXABLE) {
            return amount;
        }
        return BigDecimal.valueOf(amount).divide(BigDecimal.valueOf(1.1), 0, RoundingMode.HALF_UP).intValueExact();
    }

    public record RevenueRecord(
            UUID orderId, UUID orderItemId,
            UUID studentId, String studentName,
            @Nullable String guardianName, @Nullable String guardianPhone,
            @Nullable UUID programId, @Nullable String programName,
            @Nullable java.time.LocalDate enrollStart, @Nullable java.time.LocalDate enrollEnd,
            int billedAmount, int discountAmount, int paidAmount, @Nullable Instant paidAt,
            @Nullable PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, @Nullable String receiptNumber,
            OrderStatus status, int refundAmount, @Nullable Instant refundedAt, TaxType taxType
    ) {
    }

    public record RevenueSummary(
            int totalBilled, int totalCollected, int cardAmount, int bankTransferAmount, int cashAmount,
            int cashReceiptAmount, int refundAmount, int outstandingAmount, int netRevenue
    ) {
    }
}
