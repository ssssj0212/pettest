import Link from "next/link";

export default async function Home() {
  let health: string | null = null;
  try {
    // Next.js API Routes 사용 (/api/health)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/health`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      health = data.status;
    }
  } catch {
    health = null;
  }

  const cards = [
    {
      title: "예약하기",
      desc: "달력에서 시간 선택, 예약 생성/변경/취소",
      href: "/reservations",
    },
    {
      title: "반려견 서비스",
      desc: "산책/돌봄 예약 확인 및 진행 상태",
      href: "#services",
    },
    {
      title: "리뷰 & 갤러리",
      desc: "리뷰 작성, 사진 모아보기",
      href: "/reviews",
    },
    {
      title: "용품 쇼핑",
      desc: "상품 구매, 결제(카드/venmo/현금 옵션)",
      href: "/shop",
    },
    {
      title: "관리자",
      desc: "예약/주문/리뷰 관리 및 일정 확인",
      href: "/admin",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FFF8F0] text-[#4A4A4A]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#FF6B6B] mb-2">반려견 서비스</h1>
            <p className="text-[#8B7355] text-lg">
              예약·리뷰·갤러리·쇼핑을 하나로, 따뜻한 서비스와 함께
            </p>
          </div>
          <div className="rounded-xl bg-white px-5 py-4 shadow-warm border border-[#F5E6D3]">
            <div className="text-xs uppercase text-[#8B7355] mb-1">백엔드 상태</div>
            <div className="text-sm font-semibold text-[#4A4A4A]">
              {health ? `✅ 연결됨 (${health})` : "❌ 연결 안 됨"}
            </div>
            <div className="text-xs text-[#8B7355] mt-1">
              env: NEXT_PUBLIC_API_BASE
            </div>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-[#F5E6D3] bg-white p-6 shadow-warm transition-all duration-300 hover:-translate-y-2 hover:shadow-warm-lg hover:border-[#FFB88C]"
            >
              <div className="text-xl font-bold text-[#4A4A4A] mb-2 group-hover:text-[#FF6B6B] transition-colors">
                {card.title}
              </div>
              <p className="mt-2 text-sm text-[#8B7355] leading-relaxed">{card.desc}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-[#FF6B6B] group-hover:text-[#FF5252] transition-colors">
                바로 가기 <span className="ml-1">→</span>
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
