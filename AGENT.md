# AGENT.md — ReserveHub

> AI 코딩 에이전트(Cursor, Claude, Copilot 등)가 이 프로젝트에서
> 작업할 때 반드시 읽어야 하는 컨텍스트 문서입니다.

---

## 1. 프로젝트 개요

**ReserveHub**는 다중 플랫폼 기반 수강 예약·관리 시스템입니다.
피트니스 / 필라테스 / 요가 / 음악 등 다양한 업종의 스튜디오를
하나의 플랫폼에서 통합 운영합니다.

| 항목 | 내용 |
|------|------|
| 서비스 유형 | 멀티테넌트 SaaS (플랫폼 단위 격리) |
| 주요 도메인 | 예약, 수강권/결제, 출결, 일정관리, 승인 이력 |
| 타겟 사용자 | 스튜디오 대표 · 점주 · 강사 · 수강생 |

---

## 2. 기술 스택

```
Backend   Spring Boot 3.x (Java 17)
          Spring Security + JWT
          Spring Data JPA / QueryDSL
          Spring Events + Outbox Relay Worker

Database  PostgreSQL 16 (Primary)
          Redis 7 (캐시 · Pub/Sub fallback)

Frontend  Vue 3 + Vite
          Pinia (상태관리)
          Tailwind CSS

Infra     Docker Compose (로컬)
          GitHub Actions (CI)
```

---

## 3. 역할 계층 (Role Hierarchy)

```
SUPER        슈퍼관리자 (대표)
  └─ SUB_SUPER   서브슈퍼관리자 (점주/사장)  ← 플랫폼 1개 고정
       └─ ADMIN      일반관리자 (강사)       ← 복수 플랫폼 가능
            └─ USER      수강생
```

### 권한 규칙 — 반드시 준수

| 규칙 | 내용 |
|------|------|
| SUB_SUPER 플랫폼 제한 | **1개 플랫폼만 담당**. DB 트리거 + 앱 레이어 이중 검증 |
| 플랫폼 생성 | SUPER만 가능 |
| 승인 처리 | SUB_SUPER 이상만 가능. 처리 시 `action_logs` 필수 기록 |
| 타 플랫폼 데이터 조회 | 절대 불가. 모든 쿼리에 `platform_id` 필터 필수 |

---

## 4. 데이터베이스 핵심 규칙

### 4-1. 필수 필터
모든 플랫폼 데이터 쿼리에 `platform_id` 조건을 명시해야 합니다.
빠뜨리면 **타 플랫폼 데이터 노출** 버그가 발생합니다.

```java
// ✅ 올바른 예
passRepository.findByPlatformIdAndStatus(platformId, PassStatus.ACTIVE);

// ❌ 절대 안 됨
passRepository.findAll();
```

### 4-2. action_logs 기록 의무
승인/반려/환불/스태프 변경 등 모든 처리 행위는
`action_logs`에 반드시 INSERT해야 합니다. 서비스 레이어에서 누락 금지.

```java
actionLogRepository.save(ActionLog.of(
    platformId, actorId,
    ActionTarget.SCHEDULE_REQUEST, requestId,
    "APPROVE", memo
));
```

### 4-3. 금액 저장 원칙
- 모든 금액은 **원(KRW) 정수**로 저장 (`INT`, 소수점 없음)
- 할인 적용은 **순차(복리) 방식**: `order_discounts.apply_order` 순서로 계산
- 주문 시점 가격은 스냅샷으로 저장 (`order_items.unit_price`)
  → 이후 `passes.price` 변경과 무관하게 이력 보존

### 4-4. Soft Delete 원칙
물리 삭제 대신 `is_active = FALSE` 또는 `left_at = NOW()` 사용.
`action_logs`는 **절대 DELETE 불가**.

---

## 5. Outbox 패턴 (이벤트 발행)

외부 알림(푸시/이메일)·비동기 처리는 반드시 **Transactional Outbox**를 통해 발행합니다.
서비스 로직과 이벤트 INSERT를 같은 트랜잭션에 묶어야 합니다.

```java
// 올바른 패턴
@Transactional
public void approveRequest(UUID requestId, UUID actorId, String memo) {
    // 1. 비즈니스 로직
    var req = requestRepository.findById(requestId).orElseThrow();
    req.approve();

    // 2. 처리 이력
    actionLogRepository.save(ActionLog.of(...));

    // 3. Outbox INSERT (같은 트랜잭션)
    outboxRepository.save(OutboxEvent.of(
        "SCHEDULE_REQUEST", requestId,
        "schedule_request.approved",
        "reservehub.schedule",
        payload
    ));
    // → COMMIT 후 Relay Worker가 외부 발행
}
```

### 발행 이벤트 목록

| 이벤트 | 트리거 | 수신자 |
|--------|--------|--------|
| `user.registered` | 회원가입 | 사용자 → 환영 메일 |
| `reservation.confirmed` | 예약 확정 | 사용자 알림 |
| `reservation.cancelled` | 예약 취소 | 사용자·강사 알림 |
| `schedule_request.created` | 변경 요청 생성 | 서브슈퍼 알림 |
| `schedule_request.approved` | 승인 처리 | 강사·수강생 알림 |
| `schedule_request.rejected` | 반려 처리 | 강사 알림 |
| `order.paid` | 결제 완료 | 영수증·수강권 발급 |
| `order.refunded` | 환불 완료 | 사용자 알림 |
| `user_pass.expiring` | D-7 만료 예정 | 재결제 유도 알림 |
| `calendar_event.shared` | 공유 일정 생성 | 해당 서브슈퍼 전원 |
| `calendar_event.hq_notice` | 본사 공지 | 전 플랫폼 |
| `slot.conflict_detected` | 강사 일정 충돌 감지 | 서브슈퍼 알림 |

---

## 6. 디렉토리 구조

```
reservehub/
├── backend/
│   └── src/main/java/com/reservehub/
│       ├── domain/
│       │   ├── user/
│       │   ├── platform/
│       │   ├── program/
│       │   ├── pass/           # 수강권·할인·주문
│       │   ├── reservation/
│       │   ├── lesson/         # 수업 실적·출결
│       │   ├── approval/       # 변경 요청·action_logs
│       │   ├── calendar/
│       │   └── outbox/         # Outbox 테이블 + Relay Worker
│       ├── api/
│       │   └── v1/             # REST Controllers
│       ├── security/           # JWT · 권한 필터
│       └── common/
│           ├── exception/
│           └── audit/          # BaseEntity (created_at, updated_at)
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── user/
│       │   ├── admin/          # 강사
│       │   ├── subsup/         # 서브슈퍼
│       │   └── super/          # 슈퍼관리자
│       ├── stores/             # Pinia
│       ├── components/
│       └── api/                # Axios 인스턴스 · 엔드포인트
└── db/
    ├── schema.sql              # DDL 전체 (reservehub_schema.sql)
    └── seed/                   # 개발용 초기 데이터
```

---

## 7. API 설계 원칙

- 버전 prefix: `/api/v1/`
- 인증: `Authorization: Bearer <JWT>`
- 플랫폼 컨텍스트: `X-Platform-Id: <UUID>` 헤더 또는 path variable
- 에러 응답 형식:

```json
{
  "code": "PLATFORM_ACCESS_DENIED",
  "message": "해당 플랫폼에 접근 권한이 없습니다.",
  "timestamp": "2026-02-26T14:32:00Z"
}
```

- 페이지네이션: `?page=0&size=20&sort=createdAt,desc`
- 날짜 포맷: ISO 8601 (`2026-02-26T14:32:00Z`)

---

## 8. 코딩 컨벤션

### Java (Backend)

```java
// ✅ Entity ID는 UUID
@Id @GeneratedValue
private UUID id;

// ✅ 금액 필드는 int (원 단위)
private int price;

// ✅ 상태 변경은 도메인 메서드로
order.pay();          // order.setStatus(PAID) 금지
request.approve();

// ✅ 플랫폼 권한 검증은 항상 서비스 최상단에서
platformAccessGuard.verify(platformId, currentUser);
```

### SQL (QueryDSL / JPQL)

```java
// ✅ platform_id 필터 필수
.where(pass.platformId.eq(platformId)
    .and(pass.isActive.isTrue()))

// ✅ 재결제 임박 조회 — View 활용
nativeQuery("SELECT * FROM vw_expiring_passes WHERE platform_id = :pid")

// ✅ 수업 이력 집계 — View 활용
nativeQuery("SELECT * FROM vw_instructor_monthly_stats WHERE platform_id = :pid AND month = :month")
```

### Vue 3 (Frontend)

```js
// ✅ API 호출 시 플랫폼 헤더 자동 주입 (Axios interceptor)
api.get('/passes')   // X-Platform-Id 자동 포함

// ✅ 역할 기반 렌더링
<template v-if="auth.role === 'SUB_SUPER'">...</template>

// ✅ 금액 포맷
formatKRW(95000)  // → "95,000원"
```

---

## 9. 자주 실수하는 패턴 (반드시 피할 것)

| ❌ 잘못된 패턴 | ✅ 올바른 패턴 |
|---------------|---------------|
| `findAll()` 전체 조회 | `findByPlatformId(platformId)` |
| 승인 처리 후 action_logs 누락 | 항상 같은 트랜잭션에 INSERT |
| Outbox 없이 직접 Kafka 발행 | `outboxRepository.save()` 후 Relay 발행 |
| 금액 `BigDecimal` 사용 | `int` (원 단위 정수) |
| SUB_SUPER 복수 플랫폼 허용 | DB 트리거 + 서비스 레이어 이중 검증 |
| `DELETE FROM action_logs` | 절대 불가, 감사 로그는 영구 보존 |
| 할인 단순 합산 (10%+8%=18%) | 순차 적용 (apply_order 순서로 복리 계산) |

---

## 10. 개발 환경 시작

```bash
# DB 실행
docker compose up -d postgres redis

# 스키마 적용
psql -U reservehub -d reservehub -f db/schema.sql

# 백엔드 실행
cd backend && ./gradlew bootRun

# 프론트엔드 실행
cd frontend && npm install && npm run dev
```

---

## 11. 주요 View / 쿼리 레퍼런스

| View | 용도 |
|------|------|
| `vw_expiring_passes` | 재결제 임박 고객 (D-7) — 대시보드 위젯 |
| `vw_instructor_monthly_stats` | 강사별 월간 수업·출결 집계 — 수업 이력 페이지 |
| `vw_platform_monthly_revenue` | 플랫폼별 월간 매출 — 대시보드·수익 통계 |

---

*이 문서는 스키마 변경, 새 이벤트 추가, 역할 정책 변경 시 반드시 함께 업데이트하세요.*