# ReserveHub

다중 플랫폼 기반 수강 예약·관리 시스템. 피트니스 / 필라테스 / 요가 / 음악 등
다양한 업종의 스튜디오를 하나의 플랫폼에서 통합 운영하는 멀티테넌트 SaaS입니다.

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | Spring Boot 4, Java 17, Spring Security + JWT, Spring Data JPA |
| Database | PostgreSQL 16 |
| Frontend | React 19, Vite, React Router |
| Build | Gradle (백엔드), npm (프론트엔드) |

## 디렉토리 구조

```
ReserveHub/
├── backend/            Spring Boot 소스 (backend/src/main/java, resources)
├── frontend/           React + Vite 프론트엔드
├── db/schema.sql       DDL 전체 (스키마의 기준, Hibernate는 검증만 수행)
├── build.gradle        루트에서 backend 소스를 빌드하는 Gradle 설정
└── gradlew             Gradle 래퍼 (루트에서 실행)
```

## 역할 계층

```
OWNER   오너 (대표) — 플랫폼 생성 권한
  └─ MANAGER  매니저 (점주/사장) — 1개 플랫폼만 담당
       └─ ADMIN   일반관리자 (강사)
            └─ USER    수강생
```

## 시작하기

### 요구 사항

- Java 17
- Node.js 18+
- PostgreSQL 16 (로컬에 직접 설치하거나 컨테이너로 실행)

### 백엔드

```bash
# DB 생성 (예: psql로 접속 후)
createdb reservehub

# 스키마 적용
psql -U reservehub -d reservehub -f db/schema.sql

# 백엔드 실행 (반드시 저장소 루트에서 실행 — Gradle 루트 프로젝트가 여기 있음)
./gradlew bootRun
```

기본 접속 정보는 환경 변수로 재정의할 수 있습니다 (`backend/src/main/resources/application.properties` 참고):

| 변수 | 기본값 |
|------|--------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/reservehub?stringtype=unspecified` |
| `DB_USERNAME` | `reservehub` |
| `DB_PASSWORD` | `reservehub` |
| `JWT_SECRET` | 로컬 개발용 기본값 (운영 배포 전 반드시 교체) |

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 백엔드 API를 호출하려면 `VITE_API_BASE_URL` 환경 변수로 백엔드 주소를 지정하세요 (기본값 `http://localhost:8080`).

## 참고

- API 버전 prefix: `/api/v1/`
- 인증: `Authorization: Bearer <JWT>`
- 플랫폼 컨텍스트: `X-Platform-Id` 헤더
- 코딩 컨벤션과 도메인 규칙(권한, 금액 처리, Outbox 패턴 등)은 [`AGENT.md`](./AGENT.md)에 정리되어 있습니다.
