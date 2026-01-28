"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  createReservation,
  getReservations,
  getCalendarSummary,
  cancelReservation,
  type Reservation,
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function ReservationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [memo, setMemo] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendarData, setCalendarData] = useState<
    Record<string, Array<{ id: number; time: string; status: string }>>
  >({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const init = async () => {
      setPageLoading(true);
      try {
        await Promise.all([loadReservations(), loadCalendarData()]);
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [session, status, currentMonth, router]);

  const loadReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (err) {
      console.error("예약 목록 로드 실패:", err);
    }
  };

  const loadCalendarData = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await getCalendarSummary(year, month);
      setCalendarData(data.reservations || {});
    } catch (err) {
      console.error("달력 데이터 로드 실패:", err);
    }
  };

  const handleDateChange = (value: Value) => {
    setSelectedDate(value);
    setSelectedTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError("날짜와 시간을 선택해주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const date = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
      if (!date) return;

      const [hours, minutes] = selectedTime.split(":");
      const reservedAt = new Date(date);
      reservedAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await createReservation({
        reserved_at: reservedAt.toISOString(),
        memo: memo || undefined,
      });

      setMemo("");
      setSelectedTime("");
      await loadReservations();
      await loadCalendarData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 시간 옵션 (9시~18시, 30분 간격)
  const timeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // 선택된 날짜의 예약 확인
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const selectedDateKey =
    selectedDate && !Array.isArray(selectedDate)
      ? getDateKey(selectedDate)
      : null;

  const selectedDateReservations = selectedDateKey
    ? calendarData[selectedDateKey] || []
    : [];

  // 달력 타일 커스터마이징
  const tileClassName = ({ date }: { date: Date }) => {
    const key = getDateKey(date);
    if (calendarData[key] && calendarData[key].length > 0) {
      return "has-reservation";
    }
    return null;
  };

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-[#FF6B6B]">예약하기</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 달력 */}
          <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
            <h2 className="mb-4 text-xl font-bold text-[#4A4A4A]">날짜 선택</h2>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
              tileClassName={tileClassName}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) {
                  setCurrentMonth(activeStartDate);
                }
              }}
            />
            <style jsx global>{`
              .react-calendar {
                width: 100%;
                border: none;
                font-family: inherit;
              }
              .react-calendar__tile.has-reservation {
                background-color: #FFB88C;
                font-weight: 600;
                color: #4A4A4A;
              }
              .react-calendar__tile--active {
                background-color: #FF6B6B !important;
                color: white;
              }
              .react-calendar__tile:hover {
                background-color: #FFB88C;
              }
            `}</style>
          </div>

          {/* 예약 폼 */}
          <div className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
            <h2 className="mb-4 text-xl font-bold text-[#4A4A4A]">예약 정보</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                  선택한 날짜
                </label>
                <div className="mt-1 rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-sm text-[#4A4A4A] font-medium">
                  {selectedDate && !Array.isArray(selectedDate)
                    ? selectedDate.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "날짜를 선택해주세요"}
                </div>
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-[#4A4A4A] mb-2"
                >
                  시간 선택
                </label>
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                >
                  <option value="">시간 선택</option>
                  {timeSlots.map((time) => {
                    const isBooked = selectedDateReservations.some(
                      (r) => r.time === time
                    );
                    return (
                      <option key={time} value={time} disabled={isBooked}>
                        {time} {isBooked && "(예약됨)"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="memo"
                  className="block text-sm font-medium text-[#4A4A4A] mb-2"
                >
                  메모 (선택)
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                  placeholder="특이사항이나 요청사항을 입력해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedDate || !selectedTime}
                className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm mt-6"
              >
                {loading ? "예약 중..." : "예약하기"}
              </button>
            </form>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]">
          <h2 className="mb-4 text-xl font-bold text-[#4A4A4A]">내 예약 목록</h2>
          {reservations.length === 0 ? (
            <p className="text-[#8B7355] text-center py-8">예약이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4"
                >
                  <div>
                    <div className="font-semibold text-[#4A4A4A]">
                      {new Date(reservation.reserved_at).toLocaleString("ko-KR")}
                    </div>
                    {reservation.memo && (
                      <div className="mt-1 text-sm text-[#8B7355]">
                        {reservation.memo}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-[#8B7355]">
                      상태: {reservation.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {reservation.status === "BOOKED" && (
                      <button
                        onClick={async () => {
                          if (confirm("정말 취소하시겠습니까?")) {
                            try {
                              await cancelReservation(reservation.id);
                              await loadReservations();
                              await loadCalendarData();
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : "취소에 실패했습니다."
                              );
                            }
                          }
                        }}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-[#FF6B6B] transition hover:bg-[#FF6B6B] hover:text-white border border-[#FF6B6B]"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

