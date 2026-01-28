"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="border-b border-[#F5E6D3] bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-[#FF6B6B] hover:text-[#FF5252] transition-colors">
          🐾 반려견 서비스
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFB88C] border-t-[#FF6B6B]" />
          ) : session?.user ? (
            <>
              <span className="text-sm text-[#8B7355]">
                {session.user.name} ({session.user.email})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-[#FFF8F0] px-4 py-1.5 text-sm font-medium text-[#8B7355] transition hover:bg-[#FFB88C] hover:text-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-[#FFF8F0] px-4 py-1.5 text-sm font-medium text-[#8B7355] transition hover:bg-[#FFB88C] hover:text-white"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#FF6B6B] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#FF5252] shadow-warm"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

