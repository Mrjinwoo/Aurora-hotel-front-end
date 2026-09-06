const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type JWTPayload = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "guest";
  exp: number;
};

export function decodeToken(token: string): JWTPayload | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  return !!payload && payload.exp * 1000 > Date.now();
}

export function saveTokens(access: string, refresh: string) {
  const payload = decodeToken(access);
  localStorage.setItem("token", access);
  localStorage.setItem("refresh_token", refresh);
  if (payload) {
    localStorage.setItem("role", payload.role);
    localStorage.setItem("name", payload.name);
  }
}

export function getCurrentUser(): JWTPayload | null {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    clearAuth();
    return null;
  }
  return decodeToken(token);
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}

export async function getToken(): Promise<string | null> {
  const token = localStorage.getItem("token");
  if (token && isTokenValid(token)) return token;

  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) { clearAuth(); return null; }

  try {
    const res = await fetch(`${API}/api/users/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) { clearAuth(); return null; }
    const data = await res.json();
    const payload = decodeToken(data.access);
    localStorage.setItem("token", data.access);
    if (payload) {
      localStorage.setItem("role", payload.role);
      localStorage.setItem("name", payload.name);
    }
    return data.access;
  } catch {
    clearAuth();
    return null;
  }
}
