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
    confirmPassword: "",
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 비밀번호 최소 8자 검증
    if (formData.password.length < 8) {
      newErrors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
    }

    // 비밀번호 확인 일치 검증
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 유효성 검증
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // confirmPassword는 제외하고 전송
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // 회원가입 성공 후 자동 로그인
      await login({ username: formData.email, password: formData.password });
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "회원가입에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 폼 유효성 검사 (버튼 disabled 처리용)
  const isFormValid = () => {
    return (
      formData.email.length > 0 &&
      formData.name.length > 0 &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword &&
      formData.confirmPassword.length > 0
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-warm-lg border border-[#F5E6D3]">
        <h1 className="mb-8 text-3xl font-bold text-[#FF6B6B]">회원가입</h1>

        {errors.general && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
            {errors.general}
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
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                // 실시간 검증
                if (e.target.value.length > 0 && e.target.value.length < 8) {
                  setErrors((prev) => ({
                    ...prev,
                    password: "비밀번호는 최소 8자 이상이어야 합니다.",
                  }));
                } else {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.password;
                    return newErrors;
                  });
                }
                // 비밀번호 확인 재검증
                if (formData.confirmPassword && e.target.value !== formData.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: "비밀번호가 일치하지 않습니다.",
                  }));
                } else if (formData.confirmPassword && e.target.value === formData.confirmPassword) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.confirmPassword;
                    return newErrors;
                  });
                }
              }}
              required
              minLength={8}
              className={`mt-1 w-full rounded-lg border px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : "border-[#F5E6D3] focus:border-[#FF6B6B] focus:ring-[#FFB88C]"
              }`}
              placeholder="비밀번호를 입력하세요 (최소 8자)"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#4A4A4A] mb-2"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                // 실시간 검증
                if (e.target.value && e.target.value !== formData.password) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: "비밀번호가 일치하지 않습니다.",
                  }));
                } else {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.confirmPassword;
                    return newErrors;
                  });
                }
              }}
              required
              className={`mt-1 w-full rounded-lg border px-4 py-3 bg-[#FFF8F0] text-[#4A4A4A] focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : "border-[#F5E6D3] focus:border-[#FF6B6B] focus:ring-[#FFB88C]"
              }`}
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
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
            disabled={loading || !isFormValid()}
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












