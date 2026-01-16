"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username: email, password });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-warm-lg border border-[#F5E6D3]">
        <h1 className="mb-8 text-3xl font-bold text-[#FF6B6B]">로그인</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#4A4A4A] mb-2"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#4A4A4A] mb-2"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm mt-6"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F5E6D3]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#8B7355]">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              // NextAuth Google 로그인 호출
              signIn("google", { callbackUrl: "/" });
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-[#F5E6D3] bg-white px-4 py-3 font-medium text-[#4A4A4A] transition hover:bg-[#FFF8F0] hover:border-[#FFB88C] shadow-sm"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 계속하기
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[#8B7355]">
          계정이 없으신가요?{" "}
          <Link href="/register" className="text-[#FF6B6B] font-medium hover:text-[#FF5252] hover:underline transition-colors">
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}












