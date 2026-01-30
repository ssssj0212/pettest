import { Order } from "@/lib/api";

interface OrdersTabProps {
  orders: Order[];
}

export function OrdersTab({ orders }: OrdersTabProps) {
  return (
    <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
      <div className="p-6">
        <h2 className="text-xl font-bold text-[#4A4A4A]">주문 목록</h2>
        {orders.length === 0 ? (
          <div className="mt-4 text-center text-[#8B7355]">
            주문이 없습니다.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4">
                <div className="font-semibold text-[#4A4A4A]">
                  주문 #{order.id} -{" "}
                  <span className="text-[#FF6B6B]">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-[#8B7355] mt-1">
                  상태: {order.status} | 결제: {order.payment_method || "N/A"} (
                  {order.payment_status})
                </div>
                <div className="mt-2 text-xs text-[#8B7355]">
                  {new Date(order.created_at).toLocaleString("ko-KR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
