const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// 토큰 관리 (클라이언트 사이드)
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

// API 호출 헬퍼
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Health check
export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json() as Promise<{ status: string }>;
}

// Auth APIs
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginData {
  username: string; // OAuth2PasswordRequestForm은 username 필드 사용
  password: string;
}

export async function register(data: RegisterData) {
  return apiCall<{ id: number; email: string; name: string; role: string }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function login(data: LoginData) {
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Login failed: ${res.status}`);
  }

  const result = (await res.json()) as LoginResponse;
  setToken(result.access_token);
  return result;
}

export async function getMe() {
  return apiCall<{
    id: number;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
  }>("/auth/me");
}

// Reservation APIs
export interface ReservationCreate {
  reserved_at: string; // ISO datetime string
  memo?: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  reserved_at: string;
  status: string;
  memo?: string;
  created_at: string;
}

export async function createReservation(data: ReservationCreate) {
  return apiCall<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getReservations() {
  return apiCall<Reservation[]>("/reservations");
}

export async function getReservation(id: number) {
  return apiCall<Reservation>(`/reservations/${id}`);
}

export async function updateReservation(
  id: number,
  data: Partial<ReservationCreate & { status?: string }>
) {
  return apiCall<Reservation>(`/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cancelReservation(id: number) {
  return apiCall<{ message: string }>(`/reservations/${id}`, {
    method: "DELETE",
  });
}

// Product APIs
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  is_active: boolean;
  created_at: string;
}

export async function getProducts() {
  return apiCall<Product[]>("/products");
}


