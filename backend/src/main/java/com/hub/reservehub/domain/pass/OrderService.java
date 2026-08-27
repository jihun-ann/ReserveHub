package com.hub.reservehub.domain.pass;

import com.hub.reservehub.domain.approval.ActionLog;
import com.hub.reservehub.domain.approval.ActionLogRepository;
import com.hub.reservehub.domain.approval.ActionTarget;
import com.hub.reservehub.domain.outbox.OutboxEvent;
import com.hub.reservehub.domain.outbox.OutboxEventRepository;
import com.hub.reservehub.domain.platform.PlatformAccessGuard;
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

    public record PassSelection(UUID passId, short quantity) {
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

        record ResolvedItem(Pass pass, short quantity, int lineTotal) {
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
            resolvedItems.add(new ResolvedItem(pass, selection.quantity(), lineTotal));
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
            orderItemRepository.save(new OrderItem(order.getId(), item.pass().getId(), item.quantity(), item.pass().getPrice()));
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
    public List<Order> listByPlatform(UUID platformId, AuthenticatedUser actor) {
        platformAccessGuard.verify(platformId, actor);
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
    public Order pay(UUID orderId, AuthenticatedUser actor) {
        Order order = findOrder(orderId);
        verifyBuyerOrStaff(order, actor);
        order.pay();

        for (OrderItem item : orderItemRepository.findByOrderId(orderId)) {
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

        return order;
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
    public Order refund(UUID orderId, AuthenticatedUser actor, @Nullable String memo) {
        Order order = findOrder(orderId);
        platformAccessGuard.verify(order.getPlatformId(), actor);
        order.refund();

        for (OrderItem item : orderItemRepository.findByOrderId(orderId)) {
            for (UserPass userPass : userPassRepository.findByOrderItemId(item.getId())) {
                if (userPass.getStatus() == UserPassStatus.ACTIVE) {
                    userPass.suspend();
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
