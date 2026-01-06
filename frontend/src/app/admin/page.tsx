"use client";

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
  }, []);

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
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const user = await getMe();
      if (user.role !== "ADMIN") {
        router.push("/");
        return;
      }
    } catch {
      router.push("/login");
    }
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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-semibold">관리자 대시보드</h1>

        <div className="mb-6 flex gap-2 border-b">
          {(["dashboard", "reservations", "orders", "users", "products"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
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
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-gray-600">총 예약</div>
              <div className="text-2xl font-bold">{stats.reservations.total}</div>
              <div className="mt-2 text-xs text-gray-500">
                대기 중: {stats.reservations.pending}
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-gray-600">총 주문</div>
              <div className="text-2xl font-bold">{stats.orders.total}</div>
              <div className="mt-2 text-xs text-gray-500">
                대기 중: {stats.orders.pending}
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-gray-600">총 매출</div>
              <div className="text-2xl font-bold">
                ${stats.orders.total_revenue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-gray-600">총 사용자</div>
              <div className="text-2xl font-bold">{stats.users.total}</div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-sm text-gray-600">총 리뷰</div>
              <div className="text-2xl font-bold">{stats.reviews.total}</div>
              <div className="mt-2 text-xs text-gray-500">
                평균 평점: {stats.reviews.average_rating.toFixed(1)}/5
              </div>
            </div>
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold">예약 목록</h2>
              <div className="mt-4 space-y-3">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="rounded border p-4"
                  >
                    <div className="font-medium">
                      {new Date(reservation.reserved_at).toLocaleString("ko-KR")}
                    </div>
                    <div className="text-sm text-gray-600">
                      상태: {reservation.status}
                    </div>
                    {reservation.memo && (
                      <div className="mt-1 text-sm text-gray-500">
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
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold">주문 목록</h2>
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded border p-4">
                    <div className="font-medium">
                      주문 #{order.id} - ${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      상태: {order.status} | 결제: {order.payment_method || "N/A"} ({order.payment_status})
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString("ko-KR")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold">사용자 목록</h2>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded border p-4">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">
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
              <h2 className="text-xl font-semibold">상품 관리</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", description: "", price: "" });
                  setShowProductForm(true);
                }}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                상품 추가
              </button>
            </div>

            {showProductForm && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">
                  {editingProduct ? "상품 수정" : "상품 추가"}
                </h3>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      상품명
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      설명
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }}
                      className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg bg-white p-6 shadow">
                  <h3 className="font-semibold">{product.name}</h3>
                  {product.description && (
                    <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
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
                        className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-200"
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









