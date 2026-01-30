import { Reservation } from "@/lib/api";

interface ReservationsTabProps {
  reservations: Reservation[];
}

export function ReservationsTab({ reservations }: ReservationsTabProps) {
  return (
    <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
      <div className="p-6">
        <h2 className="text-xl font-bold text-[#4A4A4A]">예약 목록</h2>
        {reservations.length === 0 ? (
          <div className="mt-4 text-center text-[#8B7355]">
            예약이 없습니다.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
