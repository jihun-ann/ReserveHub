package com.hub.reservehub.api.v1;

import com.hub.reservehub.domain.pass.Order;
import com.hub.reservehub.domain.pass.OrderDiscount;
import com.hub.reservehub.domain.pass.OrderItem;
import com.hub.reservehub.domain.pass.OrderService;
import com.hub.reservehub.domain.pass.OrderStatus;
import com.hub.reservehub.domain.pass.UserPass;
import com.hub.reservehub.domain.pass.UserPassStatus;
import com.hub.reservehub.security.AuthenticatedUser;
import com.hub.reservehub.security.CurrentAuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class OrderController {

    private final OrderService orderService;
    private final CurrentAuthenticatedUser currentAuthenticatedUser;

    public OrderController(OrderService orderService, CurrentAuthenticatedUser currentAuthenticatedUser) {
        this.orderService = orderService;
        this.currentAuthenticatedUser = currentAuthenticatedUser;
    }

    @PostMapping("/api/v1/platforms/{platformId}/orders")
    // buyerUserId omitted means self-checkout; a staff member may set it to run a counter sale.
    // buyerUserId를 생략하면 본인 결제. 스태프는 상담 결제를 위해 다른 사용자 id를 지정할 수 있다.
    public ResponseEntity<OrderResponse> createOrder(@PathVariable UUID platformId, @Valid @RequestBody CreateOrderRequest request) {
        AuthenticatedUser actor = currentAuthenticatedUser.get();
        UUID buyerUserId = request.buyerUserId() != null ? request.buyerUserId() : actor.getId();
        List<OrderService.PassSelection> selections = request.items().stream()
                .map(item -> new OrderService.PassSelection(item.passId(), item.quantity()))
                .toList();
        List<UUID> discountPolicyIds = request.discountPolicyIds() != null ? request.discountPolicyIds() : List.of();

        Order order = orderService.createOrder(platformId, actor, buyerUserId, selections, discountPolicyIds, request.memo());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(order));
    }

    @GetMapping("/api/v1/orders/{id}")
    public OrderResponse getOrder(@PathVariable UUID id) {
        Order order = orderService.get(id, currentAuthenticatedUser.get());
        return toResponse(order);
    }

    @GetMapping("/api/v1/platforms/{platformId}/orders")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public List<OrderResponse> listOrders(@PathVariable UUID platformId) {
        return orderService.listByPlatform(platformId, currentAuthenticatedUser.get()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/api/v1/orders/{id}/pay")
    public OrderResponse pay(@PathVariable UUID id) {
        return toResponse(orderService.pay(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/orders/{id}/cancel")
    public OrderResponse cancel(@PathVariable UUID id) {
        return toResponse(orderService.cancel(id, currentAuthenticatedUser.get()));
    }

    @PostMapping("/api/v1/orders/{id}/refund")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public OrderResponse refund(@PathVariable UUID id, @RequestBody(required = false) RefundRequest request) {
        String memo = request != null ? request.memo() : null;
        return toResponse(orderService.refund(id, currentAuthenticatedUser.get(), memo));
    }

    @GetMapping("/api/v1/users/me/passes")
    public List<UserPassResponse> myPasses() {
        return orderService.myPasses(currentAuthenticatedUser.get()).stream().map(UserPassResponse::from).toList();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = orderService.getItems(order.getId()).stream().map(OrderItemResponse::from).toList();
        List<OrderDiscountResponse> discounts = orderService.getDiscounts(order.getId()).stream().map(OrderDiscountResponse::from).toList();
        return OrderResponse.from(order, items, discounts);
    }

    public record OrderItemRequest(@NotNull UUID passId, @Positive short quantity) {
    }

    public record CreateOrderRequest(
            UUID buyerUserId,
            @NotEmpty List<OrderItemRequest> items,
            List<UUID> discountPolicyIds,
            String memo
    ) {
    }

    public record RefundRequest(String memo) {
    }

    public record OrderItemResponse(UUID id, UUID passId, short quantity, int unitPrice, int lineTotal) {
        public static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(item.getId(), item.getPassId(), item.getQuantity(), item.getUnitPrice(), item.getLineTotal());
        }
    }

    public record OrderDiscountResponse(UUID policyId, String policyName, BigDecimal rate, int baseAmount, int discountAmount, short applyOrder) {
        public static OrderDiscountResponse from(OrderDiscount discount) {
            return new OrderDiscountResponse(
                    discount.getPolicyId(), discount.getPolicyName(), discount.getRate(),
                    discount.getBaseAmount(), discount.getDiscountAmount(), discount.getApplyOrder()
            );
        }
    }

    public record OrderResponse(
            UUID id, UUID userId, UUID platformId, OrderStatus status,
            int originalAmount, int discountAmount, int finalAmount, Instant paidAt, String memo,
            List<OrderItemResponse> items, List<OrderDiscountResponse> discounts
    ) {
        public static OrderResponse from(Order order, List<OrderItemResponse> items, List<OrderDiscountResponse> discounts) {
            return new OrderResponse(
                    order.getId(), order.getUserId(), order.getPlatformId(), order.getStatus(),
                    order.getOriginalAmount(), order.getDiscountAmount(), order.getFinalAmount(),
                    order.getPaidAt(), order.getMemo(), items, discounts
            );
        }
    }

    public record UserPassResponse(
            UUID id, UUID passId, UUID platformId, Integer sessionsTotal, int sessionsUsed,
            UserPassStatus status, LocalDate startedAt, LocalDate expiresAt
    ) {
        public static UserPassResponse from(UserPass userPass) {
            return new UserPassResponse(
                    userPass.getId(), userPass.getPassId(), userPass.getPlatformId(), userPass.getSessionsTotal(),
                    userPass.getSessionsUsed(), userPass.getStatus(), userPass.getStartedAt(), userPass.getExpiresAt()
            );
        }
    }
}
