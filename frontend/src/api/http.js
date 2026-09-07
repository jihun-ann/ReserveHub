export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 인증은 서버 세션 기반이다 — 세션 id는 HttpOnly 쿠키에만 담겨 브라우저-서버 사이를 오가고,
// 프론트는 그 쿠키를 읽거나 들고 다닐 필요가 없다(credentials:"include"만 붙이면 브라우저가
// 알아서 실어 보낸다). 프로필(이름/이메일/전화번호)도 어떤 Web Storage에도 남기지 않고 메모리에만
// 캐시하며, 새로고침으로 메모리가 비면 GET /api/v1/auth/me로 다시 조회한다(loadCurrentUser).
let cachedUser = null;

export function setSession(user) {
  cachedUser = user;
}

// 서버 세션을 실제로 끊어야(로그아웃) 쿠키만 지우고 서버엔 세션이 남는 상황을 피할 수 있다.
export async function clearSession() {
  try {
    await apiPost("/api/v1/auth/logout");
  } catch {
    // 세션이 이미 만료됐어도 로컬 캐시 정리는 계속 진행한다.
  } finally {
    cachedUser = null;
  }
}

export function getCurrentUser() {
  return cachedUser;
}

// 새로고침 직후처럼 메모리 캐시가 비어있을 때 호출한다 — 세션이 없거나 만료됐으면 null을 반환한다.
export async function loadCurrentUser() {
  try {
    cachedUser = await apiGet("/api/v1/auth/me");
    return cachedUser;
  } catch {
    return null;
  }
}

// name이 비어있을 때를 위한 대체 표시용 — username(로그인 아이디) 기준으로 만든다.
export function displayName(user) {
  const username = user?.username;
  return username ? username[0].toUpperCase() + username.slice(1) : "알 수 없음";
}

async function request(method, path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
// multipart 경계(boundary)를 포함해 자동으로 설정한다.
export async function apiPostForm(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
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
