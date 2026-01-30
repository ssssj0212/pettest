interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface UsersTabProps {
  users: User[];
}

export function UsersTab({ users }: UsersTabProps) {
  return (
    <div className="rounded-2xl bg-white shadow-warm border border-[#F5E6D3]">
      <div className="p-6">
        <h2 className="text-xl font-bold text-[#4A4A4A]">사용자 목록</h2>
        {users.length === 0 ? (
          <div className="mt-4 text-center text-[#8B7355]">
            사용자가 없습니다.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-[#F5E6D3] bg-[#FFF8F0] p-4">
                <div className="font-semibold text-[#4A4A4A]">{user.name}</div>
                <div className="text-sm text-[#8B7355] mt-1">{user.email}</div>
                <div className="text-xs text-[#8B7355] mt-1">
                  역할: <span className={user.role === "ADMIN" ? "text-[#FF6B6B] font-semibold" : ""}>{user.role}</span> | 활성: {user.is_active ? "예" : "아니오"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
