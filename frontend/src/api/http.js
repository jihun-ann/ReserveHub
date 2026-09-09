export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 인증은 무상태 JWT bearer 토큰 기반이다 — 로그인/회원가입이 발급한 토큰을 localStorage에 저장해두고
// 모든 요청에 Authorization: Bearer 헤더로 실어 보낸다. 토큰 자체를 복호화하면 서버 호출 없이도
// id/username/role을 바로 알 수 있고, 이름/연락처 같은 상세 프로필은 그 토큰으로 GET /auth/me를
// 호출해 조회한다(loadCurrentUser).
let cachedUser = null;

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// JWT의 payload(가운데 조각)만 복호화한다 — 서명 검증은 서버가 하므로 여기서는 클레임을 읽기만 한다.
function decodeAccessToken(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const claims = JSON.parse(json);
    return { id: claims.uid, username: claims.sub, role: claims.role };
  } catch {
    return null;
  }
}

// 로그인/회원가입 응답의 accessToken을 저장하고, 토큰을 복호화한 최소 정보(id/username/role)를
// 즉시 캐시한다 — 상세 프로필(이름/연락처 등)이 필요하면 이후 loadCurrentUser가 채운다.
export function setSession(accessToken) {
  localStorage.setItem("accessToken", accessToken);
  cachedUser = decodeAccessToken(accessToken);
  return cachedUser;
}

// 무상태 토큰이라 서버에 무효화할 세션이 없다 — 로컬에서 토큰만 지우면 로그아웃된다.
export function clearSession() {
  localStorage.removeItem("accessToken");
  cachedUser = null;
}

export function getCurrentUser() {
  return cachedUser;
}

// 새로고침 직후처럼 메모리 캐시가 비어있을 때 호출한다 — 저장된 토큰으로 상세 프로필을 조회하고,
// 토큰이 없거나 만료됐으면 null을 반환한다.
export async function loadCurrentUser() {
  if (!getAccessToken()) return null;
  try {
    cachedUser = await apiGet("/api/v1/auth/me");
    return cachedUser;
  } catch {
    clearSession();
    return null;
  }
}

// name이 비어있을 때를 위한 대체 표시용 — username(로그인 아이디) 기준으로 만든다.
export function displayName(user) {
  const username = user?.username;
  return username ? username[0].toUpperCase() + username.slice(1) : "알 수 없음";
}

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(method, path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Request failed: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body);
export const apiPatch = (path, body) => request("PATCH", path, body);
export const apiDelete = (path) => request("DELETE", path);

// 파일 첨부(FormData)는 JSON이 아니므로 Content-Type을 직접 지정하지 않는다 — 브라우저가
// multipart 경계(boundary)를 포함해 자동으로 설정한다. Authorization만 그대로 실어 보낸다.
export async function apiPostForm(path, formData) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Request failed: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export const changePassword = (currentPassword, newPassword) =>
  apiPatch("/api/v1/users/me/password", { currentPassword, newPassword });

// 세션에 캐시된 user 정보(이름/연락처/이메일)도 같이 갱신해서, 재로그인 없이 사이드바 등에 바로 반영되게 한다.
export async function updateProfile(name, phone, email) {
  const updated = await apiPatch("/api/v1/users/me", { name, phone, email });
  if (cachedUser) {
    cachedUser = { ...cachedUser, name: updated.name, phone: updated.phone, email: updated.email };
  }
  return updated;
}

// 정산 계좌 — 강사/매니저가 마이페이지에서 등록하면, 오너가 초대한 세무사가 플랫폼별로 조회할 수 있다.
export async function updateBankInfo(bankName, bankAccountNumber, bankAccountHolder) {
  const updated = await apiPatch("/api/v1/users/me/bank-info", { bankName, bankAccountNumber, bankAccountHolder });
  if (cachedUser) {
    cachedUser = {
      ...cachedUser,
      bankName: updated.bankName,
      bankAccountNumber: updated.bankAccountNumber,
      bankAccountHolder: updated.bankAccountHolder
    };
  }
  return updated;
}
