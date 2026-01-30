"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboard,
  getAdminReservations,
  getAdminOrders,
  getAdminUsers,
  getProducts,
  getMe,
  type DashboardStats,
  type Reservation,
  type Order,
  type Product,
} from "@/lib/api";
import {
  AdminTabs,
  DashboardTab,
  ReservationsTab,
  OrdersTab,
  UsersTab,
  ProductsTab,
} from "@/components/admin";

type TabId = "dashboard" | "reservations" | "orders" | "users" | "products";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [error, setError] = useState("");

  // 데이터 상태
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // 인증 및 권한 체크
  useEffect(() => {
    checkAdmin();
  }, [status]);

  // 탭 변경 시 데이터 로딩
  useEffect(() => {
    if (status === "authenticated") {
      loadTabData(activeTab);
    }
  }, [activeTab, status]);

  const checkAdmin = async () => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    // ✅ 관리자 권한 체크
    try {
      const user = await getMe();
      
      if (user.role !== "ADMIN") {
        setError("관리자 권한이 필요합니다.");
        alert("관리자 권한이 필요합니다. 일반 사용자는 이 페이지에 접근할 수 없습니다.");
        router.push("/");
        return;
      }

      console.log("관리자 권한 확인:", user.email, user.role);
    } catch (err) {
      console.error("권한 확인 실패:", err);
      setError("권한을 확인할 수 없습니다. 다시 로그인해주세요.");
      router.push("/api/auth/signin");
    }
  };

  const loadTabData = async (tab: TabId) => {
    try {
      setError("");
      switch (tab) {
        case "dashboard":
          await loadDashboard();
          break;
        case "reservations":
          await loadReservations();
          break;
        case "orders":
          await loadOrders();
          break;
        case "users":
          await loadUsers();
          break;
        case "products":
          await loadProducts();
          break;
      }
    } catch (err) {
      console.error(`${tab} 데이터 로드 실패:`, err);
      setError(`데이터를 불러오는데 실패했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  };

  const loadDashboard = async () => {
    const data = await getDashboard();
    setStats(data);
  };

  const loadReservations = async () => {
    const data = await getAdminReservations();
    setReservations(data);
  };

  const loadOrders = async () => {
    const data = await getAdminOrders();
    setOrders(data);
  };

  const loadUsers = async () => {
    const data = await getAdminUsers();
    setUsers(data);
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-[#8B7355]">로딩 중...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold text-[#FF6B6B]">관리자 대시보드</h1>

        <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && <DashboardTab stats={stats} />}
        {activeTab === "reservations" && <ReservationsTab reservations={reservations} />}
        {activeTab === "orders" && <OrdersTab orders={orders} />}
        {activeTab === "users" && <UsersTab users={users} />}
        {activeTab === "products" && (
          <ProductsTab products={products} onProductsChange={loadProducts} />
        )}
      </div>
    </main>
  );
}
