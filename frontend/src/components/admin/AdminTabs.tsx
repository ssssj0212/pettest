interface Tab {
  id: "dashboard" | "reservations" | "orders" | "users" | "products";
  label: string;
}

const TABS: Tab[] = [
  { id: "dashboard", label: "대시보드" },
  { id: "reservations", label: "예약 관리" },
  { id: "orders", label: "주문 관리" },
  { id: "users", label: "사용자 관리" },
  { id: "products", label: "상품 관리" },
];

interface AdminTabsProps {
  activeTab: Tab["id"];
  onTabChange: (tab: Tab["id"]) => void;
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b border-[#F5E6D3]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === tab.id
              ? "border-b-2 border-[#FF6B6B] text-[#FF6B6B]"
              : "text-[#8B7355] hover:text-[#FF6B6B]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
