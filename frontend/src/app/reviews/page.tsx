"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getReviews,
  createReview,
  getToken,
  type Review,
} from "@/lib/api";

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    reservation_id: undefined as number | undefined,
    order_id: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (err) {
      console.error("리뷰 로드 실패:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createReview({
        rating: formData.rating,
        comment: formData.comment || undefined,
        reservation_id: formData.reservation_id,
        order_id: formData.order_id,
      });
      setFormData({
        rating: 5,
        comment: "",
        reservation_id: undefined,
        order_id: undefined,
      });
      setShowForm(false);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[#FF6B6B]">리뷰</h1>
          <button
            onClick={() => {
              if (!getToken()) {
                router.push("/login");
                return;
              }
              setShowForm(!showForm);
            }}
            className="rounded-lg bg-[#FF6B6B] px-5 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
          >
            {showForm ? "취소" : "리뷰 작성"}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
            <h2 className="mb-4 text-xl font-bold text-[#4A4A4A]">리뷰 작성</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                  평점
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: parseInt(e.target.value) })
                  }
                  required
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                >
                  <option value={5}>5점 - 매우 만족</option>
                  <option value={4}>4점 - 만족</option>
                  <option value={3}>3점 - 보통</option>
                  <option value={2}>2점 - 불만족</option>
                  <option value={1}>1점 - 매우 불만족</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-[#4A4A4A] mb-2"
                >
                  후기 내용
                </label>
                <textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                  placeholder="서비스에 대한 후기를 작성해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm mt-6"
              >
                {loading ? "작성 중..." : "리뷰 등록"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center text-[#8B7355] shadow-warm border border-[#F5E6D3]">
              아직 등록된 리뷰가 없습니다.
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="font-bold text-[#4A4A4A]">
                        {review.user_name || "익명"}
                      </span>
                      <div className="flex text-[#FF8E53] text-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>
                            {i < review.rating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-[#8B7355] font-medium">
                        ({review.rating}/5)
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mb-3 text-[#4A4A4A] leading-relaxed">{review.comment}</p>
                    )}
                    <div className="text-xs text-[#8B7355]">
                      {new Date(review.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}












