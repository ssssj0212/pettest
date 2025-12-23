import Link from "next/link";
import { getHealth } from "@/lib/api";

export default async function Home() {
  let health: string | null = null;
  try {
    const res = await getHealth();
    health = res.status;
  } catch {
    health = null;
  }

  const cards = [
    {
      title: "예약하기",
      desc: "달력에서 시간 선택, 예약 생성/변경/취소",
      href: "#reservations",
    },
    {
      title: "반려견 서비스",
      desc: "산책/돌봄 예약 확인 및 진행 상태",
      href: "#services",
    },
    {
      title: "리뷰 & 갤러리",
      desc: "리뷰 작성, 사진 모아보기",
      href: "#reviews",
    },
    {
      title: "용품 쇼핑",
      desc: "상품 구매, 결제(카드/venmo/현금 옵션)",
      href: "#shop",
    },
    {
      title: "관리자",
      desc: "예약/주문/리뷰 관리 및 일정 확인",
      href: "#admin",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Rover 스타일 반려견 서비스</h1>
            <p className="text-gray-600">
              예약·리뷰·갤러리·쇼핑을 하나로, 반응형 웹 & PWA 준비
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 shadow">
            <div className="text-xs uppercase text-gray-500">백엔드 상태</div>
            <div className="text-sm font-medium">
              {health ? `연결됨 (${health})` : "연결 안 됨"}
            </div>
            <div className="text-xs text-gray-500">
              env: NEXT_PUBLIC_API_BASE (기본 http://localhost:8000)
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-lg font-semibold">{card.title}</div>
              <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              <span className="mt-3 inline-flex text-sm text-blue-600">
                바로 가기 →
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
