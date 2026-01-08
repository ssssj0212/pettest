"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData);
      // 회원가입 성공 후 자동 로그인
      await login({ username: formData.email, password: formData.password });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-warm-lg border border-[#F5E6D3]">
        <h1 className="mb-8 text-3xl font-bold text-[#FF6B6B]">회원가입</h1>

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
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#4A4A4A] mb-2"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="이름을 입력하세요"
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
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[#4A4A4A] mb-2"
            >
              전화번호 (선택)
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-[#F5E6D3] px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              placeholder="전화번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm mt-6"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#8B7355]">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#FF6B6B] font-medium hover:text-[#FF5252] hover:underline transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}












