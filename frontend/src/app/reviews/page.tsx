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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">리뷰</h1>
          <button
            onClick={() => {
              if (!getToken()) {
                router.push("/login");
                return;
              }
              setShowForm(!showForm);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "취소" : "리뷰 작성"}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">리뷰 작성</h2>

            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  평점
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: parseInt(e.target.value) })
                  }
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="서비스에 대한 후기를 작성해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "작성 중..." : "리뷰 등록"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
              아직 등록된 리뷰가 없습니다.
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg bg-white p-6 shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold">
                        {review.user_name || "익명"}
                      </span>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>
                            {i < review.rating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        ({review.rating}/5)
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mb-2 text-gray-700">{review.comment}</p>
                    )}
                    <div className="text-xs text-gray-500">
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











