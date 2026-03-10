const defaultHeaders = {
  "Content-Type": "application/json",
};

export async function apiGet(path) {
  const response = await fetch(path, { headers: defaultHeaders });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}
