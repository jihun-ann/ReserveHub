const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function setSession({ accessToken, user }) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

// User has no name field yet, so derive a display label from the email's local part.
export function displayName(user) {
  const local = user?.email?.split("@")[0];
  return local ? local[0].toUpperCase() + local.slice(1) : "알 수 없음";
}

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const platformId = localStorage.getItem("platformId");
  if (platformId) headers["X-Platform-Id"] = platformId;
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

export const changePassword = (currentPassword, newPassword) =>
  apiPatch("/api/v1/users/me/password", { currentPassword, newPassword });

// 세션에 캐시된 user 정보(이름/연락처)도 같이 갱신해서, 재로그인 없이 사이드바 등에 바로 반영되게 한다.
export async function updateProfile(name, phone) {
  const updated = await apiPatch("/api/v1/users/me", { name, phone });
  const current = getCurrentUser();
  if (current) {
    localStorage.setItem("user", JSON.stringify({ ...current, name: updated.name, phone: updated.phone }));
  }
  return updated;
}
