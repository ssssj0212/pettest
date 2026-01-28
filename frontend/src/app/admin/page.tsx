"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboard,
  getAdminReservations,
  getAdminOrders,
  getAdminUsers,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getMe,
  getToken,
  type DashboardStats,
  type Reservation,
  type Order,
  type Product,
} from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "reservations" | "orders" | "users" | "products">("dashboard");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, [status]);

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboard();
    } else if (activeTab === "reservations") {
      loadReservations();
    } else if (activeTab === "orders") {
      loadOrders();
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "products") {
      loadProducts();
    }
  }, [activeTab]);

  const checkAdmin = async () => {
    // 아직 세션 로딩 중이면 아무 것도 하지 않음
    if (status === "loading") return;
  
    // 로그인 안 돼 있으면 NextAuth 로그인으로 보내기
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }
  
    // ✅ 여기서부터는 로그인은 된 상태
    // 일단은 "로그인 화면으로 다시 튕기는 문제"를 막는 게 목적이라
    // role 체크는 Step 3에서 붙일게.
  };

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setStats(data);
    } catch (err) {
      console.error("대시보드 로드 실패:", err);
    }
  };

  const loadReservations = async () => {
    try {
      const data = await getAdminReservations();
      setReservations(data);
    } catch (err) {
      console.error("예약 목록 로드 실패:", err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error("주문 목록 로드 실패:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("사용자 목록 로드 실패:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("상품 목록 로드 실패:", err);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await createProduct(productForm);
      }
      setProductForm({ name: "", description: "", price: "" });
      setEditingProduct(null);
      setShowProductForm(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold text-[#FF6B6B]">관리자 대시보드</h1>

        <div className="mb-6 flex gap-2 border-b border-[#F5E6D3]">
          {(["dashboard", "reservations", "orders", "users", "products"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === tab
                  ? "border-b-2 border-[#FF6B6B] text-[#FF6B6B]"
                  : "text-[#8B7355] hover:text-[#FF6B6B]"
              }`}
            >
              {tab === "dashboard" && "대시보드"}
              {tab === "reservations" && "예약 관리"}
              {tab === "orders" && "주문 관리"}
              {tab === "users" && "사용자 관리"}
              {tab === "products" && "상품 관리"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
              <div className="text-sm text-[#8B7355] mb-1">총 예약</div>
              <div className="text-3xl font-bold text-[#FF6B6B]">{stats.reservations.total}</div>
              <div className="mt-2 text-xs text-[#8B7355]">
                대기 중: {stats.reservations.pending}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
              <div className="text-sm text-[#8B7355] mb-1">총 주문</div>
              <div className="text-3xl font-bold text-[#FF6B6B]">{stats.orders.total}</div>
              <div className="mt-2 text-xs text-[#8B7355]">
                대기 중: {stats.orders.pending}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
              <div className="text-sm text-[#8B7355] mb-1">총 매출</div>
              <div className="text-3xl font-bold text-[#FF6B6B]">
                ${stats.orders.total_revenue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
              <div className="text-sm text-[#8B7355] mb-1">총 사용자</div>
              <div className="text-3xl font-bold text-[#FF6B6B]">{stats.users.total}</div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
              <div className="text-sm text-[#8B7355] mb-1">총 리뷰</div>
              <div className="text-3xl font-bold text-[#FF6B6B]">{stats.reviews.total}</div>
              <div className="mt-2 text-xs text-[#8B7355]">
                평균 평점: {stats.reviews.average_rating.toFixed(1)}/5
              </div>
            </div>
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#4A4A4A]">예약 목록</h2>
              <div className="mt-4 space-y-3">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4"
                  >
                    <div className="font-semibold text-[#4A4A4A]">
                      {new Date(reservation.reserved_at).toLocaleString("ko-KR")}
                    </div>
                    <div className="text-sm text-[#8B7355] mt-1">
                      상태: {reservation.status}
                    </div>
                    {reservation.memo && (
                      <div className="mt-2 text-sm text-[#8B7355]">
                        {reservation.memo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#4A4A4A]">주문 목록</h2>
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4">
                    <div className="font-semibold text-[#4A4A4A]">
                      주문 #{order.id} - <span className="text-[#FF6B6B]">${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-[#8B7355] mt-1">
                      상태: {order.status} | 결제: {order.payment_method || "N/A"} ({order.payment_status})
                    </div>
                    <div className="mt-2 text-xs text-[#8B7355]">
                      {new Date(order.created_at).toLocaleString("ko-KR")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#4A4A4A]">사용자 목록</h2>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4">
                    <div className="font-semibold text-[#4A4A4A]">{user.name}</div>
                    <div className="text-sm text-[#8B7355] mt-1">{user.email}</div>
                    <div className="text-xs text-[#8B7355] mt-1">
                      역할: {user.role} | 활성: {user.is_active ? "예" : "아니오"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-[#4A4A4A]">상품 관리</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", description: "", price: "" });
                  setShowProductForm(true);
                }}
                className="rounded-lg bg-[#FF6B6B] px-5 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
              >
                상품 추가
              </button>
            </div>

            {showProductForm && (
              <div className="rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
                <h3 className="mb-4 text-lg font-bold text-[#4A4A4A]">
                  {editingProduct ? "상품 수정" : "상품 추가"}
                </h3>
                <form onSubmit={handleProductSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                      상품명
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                      설명
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                      가격
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-[#FF6B6B] px-4 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm"
                    >
                      {loading ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }}
                      className="rounded-lg bg-[#FFF8F0] px-4 py-2.5 font-semibold text-[#8B7355] transition hover:bg-[#FFB88C] hover:text-white border border-[#F5E6D3]"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
                  <h3 className="font-bold text-[#4A4A4A]">{product.name}</h3>
                  {product.description && (
                    <p className="mt-2 text-sm text-[#8B7355] leading-relaxed">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-[#FF6B6B]">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            description: product.description || "",
                            price: product.price,
                          });
                          setShowProductForm(true);
                        }}
                        className="rounded-lg bg-[#FFB88C] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#FF8E53]"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-[#FF6B6B] transition hover:bg-[#FF6B6B] hover:text-white border border-[#FF6B6B]"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}












