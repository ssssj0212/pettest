import { DashboardStats } from "@/lib/api";

interface DashboardTabProps {
  stats: DashboardStats | null;
}

export function DashboardTab({ stats }: DashboardTabProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-[#8B7355]">
        데이터를 불러오는 중...
      </div>
    );
  }

  return (
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
  );
}
