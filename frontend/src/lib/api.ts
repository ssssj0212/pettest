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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers &&
    typeof options.headers === "object" &&
    !(options.headers instanceof Headers) &&
    !Array.isArray(options.headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body,
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

export async function getCalendarSummary(year: number, month: number) {
  return apiCall<{
    year: number;
    month: number;
    reservations: Record<string, Array<{ id: number; time: string; status: string }>>;
  }>(`/reservations/calendar?year=${year}&month=${month}`);
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

// Review APIs
export interface ReviewCreate {
  rating: number; // 1-5
  comment?: string;
  reservation_id?: number;
  order_id?: number;
}

export interface Review {
  id: number;
  user_id: number;
  reservation_id?: number;
  order_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
  user_name?: string;
}

export async function createReview(data: ReviewCreate) {
  return apiCall<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getReviews(skip = 0, limit = 50) {
  return apiCall<Review[]>(`/reviews?skip=${skip}&limit=${limit}`);
}

export async function getReview(id: number) {
  return apiCall<Review>(`/reviews/${id}`);
}

// Gallery APIs
export interface GalleryCreate {
  image_url: string;
  caption?: string;
}

export interface Gallery {
  id: number;
  image_url: string;
  caption?: string;
  created_at: string;
  is_active: boolean;
}

export async function createGalleryItem(data: GalleryCreate) {
  return apiCall<Gallery>("/gallery", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getGallery(skip = 0, limit = 50) {
  return apiCall<Gallery[]>(`/gallery?skip=${skip}&limit=${limit}`);
}

export async function getGalleryItem(id: number) {
  return apiCall<Gallery>(`/gallery/${id}`);
}

export async function deleteGalleryItem(id: number) {
  return apiCall<{ message: string }>(`/gallery/${id}`, {
    method: "DELETE",
  });
}

// Order APIs
export interface OrderCreate {
  items: Array<{ product_id: number; quantity: number }>;
  payment_method: "CARD" | "VENMO" | "CASH";
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: string;
  status: string;
  payment_method?: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

export async function createOrder(data: OrderCreate) {
  return apiCall<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrders() {
  return apiCall<Order[]>("/orders");
}

export async function getOrder(id: number) {
  return apiCall<Order>(`/orders/${id}`);
}

export async function processPayment(
  orderId: number,
  paymentMethod: "CARD" | "VENMO" | "CASH"
) {
  return apiCall<{
    message: string;
    order_id: number;
    status: string;
    payment_url?: string;
    client_secret?: string;
  }>(`/orders/${orderId}/payment`, {
    method: "POST",
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}

export async function getProduct(id: number) {
  return apiCall<Product>(`/products/${id}`);
}

// Admin APIs
export interface DashboardStats {
  reservations: {
    total: number;
    pending: number;
  };
  orders: {
    total: number;
    pending: number;
    total_revenue: number;
  };
  users: {
    total: number;
  };
  reviews: {
    total: number;
    average_rating: number;
  };
}

export async function getDashboard() {
  return apiCall<DashboardStats>("/admin/dashboard");
}

export async function getAdminReservations(skip = 0, limit = 50) {
  return apiCall<Reservation[]>(`/admin/reservations?skip=${skip}&limit=${limit}`);
}

export async function getAdminOrders(skip = 0, limit = 50) {
  return apiCall<Order[]>(`/admin/orders?skip=${skip}&limit=${limit}`);
}

export async function getAdminUsers(skip = 0, limit = 50) {
  return apiCall<Array<{
    id: number;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>>(`/admin/users?skip=${skip}&limit=${limit}`);
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: string;
}

export async function createProduct(data: ProductCreate) {
  return apiCall<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: number, data: ProductCreate) {
  return apiCall<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: number) {
  return apiCall<{ message: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}


