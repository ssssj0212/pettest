"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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












