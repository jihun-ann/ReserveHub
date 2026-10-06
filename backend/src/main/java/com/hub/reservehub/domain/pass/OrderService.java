package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.outbox.OutboxEvent;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
import com.hub.reservehub.domain.platform.ManagerTier;
import com.hub.reservehub.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds orders with sequential (compound) discounting and issues passes once payment is confirmed.
 * AGENT.md 4-3: 할인은 순차(복리) 적용, 금액은 원 단위 정수, 주문 시점 가격 스냅샷 보존.
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderDiscountRepository orderDiscountRepository;
    private final PassRepository passRepository;
    private final DiscountPolicyRepository discountPolicyRepository;
    private final UserPassRepository userPassRepository;
    private final PlatformAccessGuard platformAccessGuard;
    private final ActionLogRepository actionLogRepository;
    private final OutboxEventRepository outboxEventRepository;

    public OrderService(
            OrderRepository orderRepository, OrderItemRepository orderItemRepository,
            OrderDiscountRepository orderDiscountRepository, PassRepository passRepository,
            DiscountPolicyRepository discountPolicyRepository, UserPassRepository userPassRepository,
            PlatformAccessGuard platformAccessGuard, ActionLogRepository actionLogRepository,
            OutboxEventRepository outboxEventRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderDiscountRepository = orderDiscountRepository;
        this.passRepository = passRepository;
        this.discountPolicyRepository = discountPolicyRepository;
        this.userPassRepository = userPassRepository;
        this.platformAccessGuard = platformAccessGuard;
        this.actionLogRepository = actionLogRepository;
        this.outboxEventRepository = outboxEventRepository;
    }

    public record PassSelection(
            UUID passId, short quantity,
            @Nullable UUID programId, @Nullable LocalDate enrollStart, @Nullable LocalDate enrollEnd, @Nullable TaxType taxType
    ) {
    }

    @Transactional
    // Self-checkout needs no platform membership (catalog is public); a staff counter-sale for someone
    // else does, so the actor can't register orders against a platform they don't belong to.
    // 본인 결제는 플랫폼 소속 여부를 따지지 않는다(카탈로그는 공개). 타인 대신 등록하는 상담 결제는
    // 해당 플랫폼 스태프여야 한다.
    public Order createOrder(
            UUID platformId, AuthenticatedUser actor, UUID buyerUserId,
            List<PassSelection> selections, List<UUID> discountPolicyIds, @Nullable String memo
    ) {
        if (selections.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        boolean selfCheckout = buyerUserId.equals(actor.getId());
        if (!selfCheckout) {
            platformAccessGuard.verify(platformId, actor);
        }

        record ResolvedItem(Pass pass, short quantity, int lineTotal, PassSelection selection) {
        }
        List<ResolvedItem> resolvedItems = new ArrayList<>();
        int originalAmount = 0;
        for (PassSelection selection : selections) {
            Pass pass = passRepository.findById(selection.passId())
                    .orElseThrow(() -> new IllegalArgumentException("Pass not found: " + selection.passId()));
            if (!pass.getPlatformId().equals(platformId) || !pass.isActive()) {
                throw new IllegalArgumentException("Pass not available on this platform: " + selection.passId());
            }
            int lineTotal = pass.getPrice() * selection.quantity();
            resolvedItems.add(new ResolvedItem(pass, selection.quantity(), lineTotal, selection));
            originalAmount += lineTotal;
        }

        record DiscountStep(DiscountPolicy policy, int baseAmount, int discountAmount, short applyOrder) {
        }
        List<DiscountStep> steps = new ArrayList<>();
        int runningAmount = originalAmount;
        short applyOrder = 1;
        for (UUID policyId : discountPolicyIds) {
            DiscountPolicy policy = discountPolicyRepository.findById(policyId)
                    .orElseThrow(() -> new IllegalArgumentException("Discount policy not found: " + policyId));
            if (!policy.getPlatformId().equals(platformId) || !policy.isUsableNow()) {
                throw new IllegalStateException("Discount policy not usable: " + policyId);
            }
            int baseAmount = runningAmount;
            int discountAmount = BigDecimal.valueOf(baseAmount)
                    .multiply(policy.getRate())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                    .intValueExact();
            runningAmount -= discountAmount;
            steps.add(new DiscountStep(policy, baseAmount, discountAmount, applyOrder));
            applyOrder++;
        }
        int finalAmount = runningAmount;
        int discountAmountTotal = originalAmount - finalAmount;

        Order order = orderRepository.save(new Order(
                buyerUserId, platformId, originalAmount, discountAmountTotal, finalAmount,
                memo, selfCheckout ? null : actor.getId()
        ));

        for (ResolvedItem item : resolvedItems) {
            orderItemRepository.save(new OrderItem(
                    order.getId(), item.pass().getId(), item.quantity(), item.pass().getPrice(),
                    item.selection().programId(), item.selection().enrollStart(), item.selection().enrollEnd(),
                    item.selection().taxType()
            ));
        }
        for (DiscountStep step : steps) {
            orderDiscountRepository.save(new OrderDiscount(
                    order.getId(), step.policy().getId(), step.policy().getName(),
                    step.policy().getRate(), step.baseAmount(), step.discountAmount(), step.applyOrder()
            ));
        }

        return order;
    }

    @Transactional(readOnly = true)
    public Order get(UUID orderId, AuthenticatedUser actor) {
        Order order = findOrder(orderId);
        verifyBuyerOrStaff(order, actor);
        return order;
    }

    @Transactional(readOnly = true)
    // MANAGER 또는 오너가 초대한 세무사(재무 데이터 열람용, 매출 집계는 이 목록을 프론트에서 합산한다)만 조회 가능.
    public List<Order> listByPlatform(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verifyFinancialAccess(platformId, actor);
        return orderRepository.findByPlatformId(platformId);
    }

    @Transactional(readOnly = true)
    public List<OrderItem> getItems(UUID orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    @Transactional(readOnly = true)
    public List<OrderDiscount> getDiscounts(UUID orderId) {
        return orderDiscountRepository.findByOrderIdOrderByApplyOrder(orderId);
    }

    @Transactional
    // Confirms payment and issues one UserPass instance per purchased unit (AGENT.md event: order.paid).
    // 결제를 확정하고 구매 수량만큼 UserPass 인스턴스를 발급한다.
    public Order pay(UUID orderId, AuthenticatedUser actor, PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, @Nullable String receiptNumber) {
        Order order = findOrder(orderId);
        verifyBuyerOrStaff(order, actor);
        order.pay(paymentMethod, cashReceiptStatus, receiptNumber, actor.getId());
        issuePassesAndEmitPaidEvent(order);
        return order;
    }

    @Transactional
    // 부분납 — 이번 회차 결제만 반영하고, 완납되는 순간에만 수강권을 발급한다(선불 수강권 성격상
    // 잔금이 남았는데 이용권부터 내주지 않기 위함).
    public Order partialPay(
            UUID orderId, AuthenticatedUser actor, int amount,
            PaymentMethod paymentMethod, CashReceiptStatus cashReceiptStatus, @Nullable String receiptNumber
    ) {
        Order order = findOrder(orderId);
        verifyBuyerOrStaff(order, actor);
        order.partialPay(amount, paymentMethod, cashReceiptStatus, receiptNumber, actor.getId());
        if (order.getStatus() == OrderStatus.PAID) {
            issuePassesAndEmitPaidEvent(order);
        }
        return order;
    }

    private void issuePassesAndEmitPaidEvent(Order order) {
        for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
            Pass pass = passRepository.findById(item.getPassId())
                    .orElseThrow(() -> new IllegalArgumentException("Pass not found: " + item.getPassId()));
            Integer sessionsTotal = pass.getType() == PassType.SESSION && pass.getSessionCount() != null
                    ? Integer.valueOf(pass.getSessionCount())
                    : null;
            LocalDate startedAt = LocalDate.now();
            LocalDate expiresAt = startedAt.plusDays(pass.getValidDays());
            for (int i = 0; i < item.getQuantity(); i++) {
                userPassRepository.save(new UserPass(
                        order.getUserId(), item.getId(), pass.getId(), order.getPlatformId(),
                        sessionsTotal, startedAt, expiresAt
                ));
            }
        }

        outboxEventRepository.save(OutboxEvent.of(
                "ORDER", order.getId(), "order.paid", "reservehub.order",
                Map.of("orderId", order.getId().toString(), "userId", order.getUserId().toString(), "finalAmount", order.getFinalAmount())
        ));
    }

    @Transactional
    public Order cancel(UUID orderId, AuthenticatedUser actor) {
        Order order = findOrder(orderId);
        verifyBuyerOrStaff(order, actor);
        order.cancel();
        return order;
    }

    @Transactional
    // MANAGER 이상만 가능한 승인성 처리 — action_logs 기록은 선택이 아니라 필수다 (AGENT.md 4-2).
    // amount가 null이면 잔여 전액(finalAmount - 이미 환불된 금액)을 환불한다. 부분 환불은 수강권을
    // 정지하지 않는다 — 전액이 환불됐을 때만 이용 권한을 회수한다.
    public Order refund(UUID orderId, AuthenticatedUser actor, @Nullable Integer amount, @Nullable String memo) {
        Order order = findOrder(orderId);
        platformAccessGuard.verifyManagerTier(order.getPlatformId(), actor, ManagerTier.HIGH); // 환불: 임원급 매니저 전용
        int refundAmount = amount != null ? amount : order.getFinalAmount() - order.getRefundAmount();
        order.refund(refundAmount);

        if (order.getStatus() == OrderStatus.REFUNDED) {
            for (OrderItem item : orderItemRepository.findByOrderId(orderId)) {
                for (UserPass userPass : userPassRepository.findByOrderItemId(item.getId())) {
                    if (userPass.getStatus() == UserPassStatus.ACTIVE) {
                        userPass.suspend();
                    }
                }
            }
        }

        actionLogRepository.save(ActionLog.of(
                order.getPlatformId(), actor.getId(), ActionTarget.PASS_REFUND, order.getId(), "REFUND", memo
        ));
        outboxEventRepository.save(OutboxEvent.of(
                "ORDER", order.getId(), "order.refunded", "reservehub.order",
                Map.of("orderId", order.getId().toString(), "userId", order.getUserId().toString())
        ));

        return order;
    }

    @Transactional(readOnly = true)
    public List<UserPass> myPasses(AuthenticatedUser actor) {
        return userPassRepository.findByUserId(actor.getId());
    }

    private void verifyBuyerOrStaff(Order order, AuthenticatedUser actor) {
        if (!order.getUserId().equals(actor.getId())) {
            platformAccessGuard.verify(order.getPlatformId(), actor);
        }
    }

    private Order findOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }
}
