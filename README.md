# ReserveHub

다중 플랫폼 기반 수강 예약·관리 시스템. 피트니스 / 필라테스 / 요가 / 음악 등
다양한 업종의 스튜디오를 하나의 플랫폼에서 통합 운영하는 멀티테넌트 SaaS입니다.

## 주요 기능

- **플랫폼(센터) 운영**: 오너가 플랫폼을 만들고, 플랫폼마다 6자리 **공개 ID**(숫자 + 영문 대문자)를 가집니다. 업종별 아이콘은 화면에서 표시합니다.
- **직원 초대**: 강사/매니저를 이메일 또는 연락처로 초대 → 토큰 링크 → 링크로 접속한 계정의 정보가 초대와 일치하면 자동 승인
- **매니저 그룹 권한**: 플랫폼마다 그룹(일반/관리자/임원 등)을 만들고 **메뉴·기능 권한을 체크**해서 부여 (예전 L/M/H 등급 대체)
- **회원 가입 신청**: 회원이 플랫폼 ID/이름으로 검색해 신청 → 센터가 승인/반려 → 수강권·프로그램 등록
- **수강권·결제·환불·할인정책**, 프로그램/슬롯/수업, 출석, 시설물 예약·고장 신고, 일정 변경/휴가 요청 승인
- **세무사 연동**: 플랫폼 단위 재무 일정, 매출/직원 정산 조회
- **활동 이력**: 승인·변경·등록 작업을 "누가 무엇을 어떻게 바꿨는지" 문장으로 기록
- **내 정보**: 이메일/연락처 인증, 생년월일/보호자, 정산 계좌(강사·매니저 마이페이지), 계정 탈퇴(비활성화)

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | Spring Boot 4, Java 17, Spring Security (**JWT bearer 토큰, 무상태**), Spring Data JPA |
| Database | PostgreSQL (스키마는 `db/schema.sql`이 기준, Hibernate는 검증만 수행) |
| Frontend | React 19, Vite, React Router |
| Build | Gradle (백엔드 + 프론트 빌드를 jar에 포함), npm (프론트 개발) |
| 배포 | GitHub Actions → Jib 이미지 → Kubernetes |

## 디렉토리 구조

```
ReserveHub/
├── backend/             Spring Boot 소스 (backend/src/main/java, resources)
├── frontend/            React + Vite 프론트엔드
├── db/
│   ├── schema.sql       DDL 전체 (스키마의 기준)
│   ├── migrations/      기존 DB에 적용하는 변경 SQL (날짜순)
│   └── test_accounts.sql  개발용 테스트 계정 (운영 DB에 쓰지 말 것)
├── k8s/                 Kubernetes 매니페스트 (deployment, secret)
├── .github/workflows/   CI (이미지 빌드, 배포 태그 갱신)
├── build.gradle         루트에서 backend 소스와 frontend 빌드를 묶는 Gradle 설정
└── gradlew              Gradle 래퍼 (루트에서 실행)
```

## 역할과 권한

계정의 전역 역할(`role`)은 가입 때 정해지고, **플랫폼에서의 역할은 플랫폼마다 따로** 정해집니다. 같은 계정이 한 플랫폼에서는 오너, 다른 곳에서는 강사, 또 다른 곳에서는 회원일 수 있습니다.

| 역할 | 얻는 방법 | 설명 |
|------|-----------|------|
| OWNER | 운영자가 생성 (공개 가입 불가) | 플랫폼 생성, 모든 권한 |
| MANAGER | 직원 초대 수락 | 소속 **그룹의 권한**만 사용 (그룹이 없으면 권한 없음). 한 계정은 1개 플랫폼의 매니저만 가능 |
| TUTOR | 직원 초대 수락 | 수업·출석, 회원은 이름/수강권 상태만 조회 |
| USER | 공개 가입 | 수강생. 플랫폼 찾기 → 가입 신청 |
| TAX_ACCOUNTANT | 오너가 플랫폼 단위로 초대 | 재무 데이터 열람, 여러 오너와 동시 계약 가능 |

매니저 권한은 메뉴 10개 + 기능 9개로 나뉩니다. 오너가 **플랫폼 상세 → 매니저 탭 → 그룹 설정**에서 그룹마다 체크합니다. 권한 검사는 서버의 `PlatformAccessGuard`(`ManagerPermission`)가 하고, 화면 메뉴 숨김은 UX일 뿐입니다.

## 시작하기

### 요구 사항

- Java 17
- Node.js `^20.19` 또는 `22.12` 이상 (Vite 8 요구사항. Gradle 빌드는 자체적으로 Node 22를 받아 씁니다)
- PostgreSQL

### 백엔드

```bash
# 새 DB: 스키마를 한 번에 적용
createdb reservehub
psql -U reservehub -d reservehub -f db/schema.sql

# 이미 만들어 둔 DB: db/migrations/ 의 파일을 날짜순으로 필요한 것만 적용
psql -U reservehub -d reservehub -1 -v ON_ERROR_STOP=1 -f db/migrations/<파일>.sql

# 백엔드 실행 (반드시 저장소 루트에서 실행 — Gradle 루트 프로젝트가 여기 있음)
./gradlew bootRun
```

서버는 `ddl-auto=validate`라서 **스키마가 코드와 맞지 않으면 부팅에 실패**합니다(예: `missing table [...]`). 코드를 갱신했다면 새 마이그레이션 적용을 먼저 확인하세요.

환경 변수로 재정의할 수 있습니다 (`backend/src/main/resources/application.properties` 참고):

| 변수 / 속성 | 기본값 | 설명 |
|------|--------|------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/reservehub?stringtype=unspecified` | `stringtype=unspecified`는 Postgres ENUM 컬럼 바인딩에 필요 |
| `DB_USERNAME` | `reservehub` | |
| `DB_PASSWORD` | `reservehub` | |
| `JWT_SECRET` | 코드에 공개된 개발용 값 | **운영에서는 반드시 별도 값으로 주입** (32바이트 이상 무작위 문자열) |
| `app.cors.allowed-origins` | `http://localhost:5173,http://localhost:3000` | 프론트 주소가 다르면 지정 |
| `app.invitation.require-verified-contact` | `false` | `true`면 인증된 이메일/연락처만 초대를 수락 (메일/SMS 연동 후 사용) |
| `app.verification.sender` | `log` | 인증 코드 발송 방식. `log`는 **서버 로그에만 출력하는 개발용** |

### 프론트엔드

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run lint
```

백엔드 주소는 `VITE_API_BASE_URL`로 지정합니다 (기본값 `http://localhost:8080`).
배포용 jar를 만들면(`./gradlew build`) 프론트 빌드 결과가 jar의 `static`에 함께 들어가 백엔드가 화면까지 제공합니다.

### 개발용 테스트 계정

`db/test_accounts.sql`을 적용하면 아래 계정이 생깁니다 (이미 있으면 건너뜀). **비밀번호가 모두 `test`이므로 운영 DB에는 쓰지 마세요.**

| 아이디 | 역할 |
|--------|------|
| `owner` / `manager` / `tutor` / `user` / `tax` | 각각 OWNER / MANAGER / TUTOR / USER / TAX_ACCOUNTANT |
| `test1` ~ `test5` | USER (플랫폼이 없는 일반 계정 — 가입 신청 흐름 확인용) |

### 테스트

```bash
./gradlew test
```

- DB 없이 도는 단위 테스트(권한 계산, 결제, 시설 예약, 원천징수 등)와 달리, `AuthFlowTest`/`ReserveHubApplicationTests` 같은 **통합 테스트는 Postgres가 있어야** 실행됩니다.
- 단위 테스트만 돌리려면: `./gradlew test --tests "*ManagerPermissionAuthorizationTest" --tests "*OrderTest" --tests "*FacilityBookingTest"`

## 배포

1. `sub-branch`에 푸시하면 GitHub Actions가 Jib으로 이미지를 빌드해 GHCR에 올리고, `k8s/deployment.yaml`의 이미지 태그를 바꾸는 커밋(`deploy: <sha>`)을 만듭니다. 그 커밋 때문에 푸시가 거절되면 `git pull --rebase --autostash` 후 다시 푸시합니다.
2. 앱은 `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` / `JWT_SECRET`을 Kubernetes **Secret**(`reservehub-db`, `reservehub-jwt`)에서 꺼내 씁니다. 정의는 `k8s/secret.yaml`이며 **커밋하지 않고**(`.gitignore`) 클러스터에 직접 `kubectl apply` 합니다. 시크릿이 없는 상태로 배포하면 파드가 뜨지 않습니다.
3. Secret은 base64일 뿐 암호화가 아닙니다. 클러스터에서 etcd 저장 시 암호화를 켜고, 시크릿을 git으로 관리하려면 Sealed Secrets나 SOPS 같은 도구로 암호화해서 올리세요.

## 문서

- [`AGENT.md`](./AGENT.md) — 코딩 컨벤션과 도메인 규칙(권한, 금액 처리, Outbox 패턴 등)
- DB 변경 이력은 `db/migrations/`의 SQL 파일(날짜순)과 `db/schema.sql`을 보세요.

## 참고

- API 버전 prefix: `/api/v1/`
- 인증: `POST /api/v1/auth/login`이 JWT를 발급하고, 이후 `Authorization: Bearer <토큰>` 헤더로 보냅니다 (프론트는 localStorage에 보관, 유효 12시간). 서버는 세션을 쓰지 않습니다.
- 플랫폼 단위 API는 경로에 플랫폼 ID(UUID)를 넣습니다 (`/api/v1/platforms/{id}/...`). 사용자가 입력하는 6자리 공개 ID와 내부 UUID는 다릅니다.
- 계정 탈퇴는 삭제가 아니라 비활성화이며, 탈퇴한 아이디는 재사용할 수 없고 이메일은 활성 계정끼리만 유일합니다.
