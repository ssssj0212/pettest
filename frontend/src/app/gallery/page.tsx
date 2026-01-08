"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
  getToken,
  getMe,
  type Gallery,
} from "@/lib/api";

export default function GalleryPage() {
  const router = useRouter();
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    caption: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGallery();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const user = await getMe();
      setIsAdmin(user.role === "ADMIN");
    } catch {
      // 로그인 안 됨
    }
  };

  const loadGallery = async () => {
    try {
      const data = await getGallery(0, 100);
      setGallery(data);
    } catch (err) {
      console.error("갤러리 로드 실패:", err);
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
      await createGalleryItem({
        image_url: formData.image_url,
        caption: formData.caption || undefined,
      });
      setFormData({ image_url: "", caption: "" });
      setShowForm(false);
      await loadGallery();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 추가에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteGalleryItem(id);
      await loadGallery();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "삭제에 실패했습니다."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[#FF6B6B]">갤러리</h1>
          {isAdmin && (
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
              {showForm ? "취소" : "이미지 추가"}
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
            <h2 className="mb-4 text-xl font-bold text-[#4A4A4A]">이미지 추가</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="image_url"
                  className="block text-sm font-medium text-[#4A4A4A] mb-2"
                >
                  이미지 URL
                </label>
                <input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  required
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="caption"
                  className="block text-sm font-medium text-[#4A4A4A] mb-2"
                >
                  설명 (선택)
                </label>
                <input
                  id="caption"
                  type="text"
                  value={formData.caption}
                  onChange={(e) =>
                    setFormData({ ...formData, caption: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
                  placeholder="이미지 설명을 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm mt-6"
              >
                {loading ? "추가 중..." : "이미지 추가"}
              </button>
            </form>
          </div>
        )}

        {gallery.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center text-[#8B7355] shadow-warm border border-[#F5E6D3]">
            갤러리에 등록된 이미지가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-warm transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1 border border-[#F5E6D3]"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={item.image_url}
                    alt={item.caption || "Gallery image"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                {item.caption && (
                  <div className="p-4 bg-white">
                    <p className="text-sm text-[#4A4A4A]">{item.caption}</p>
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute right-3 top-3 rounded-lg bg-[#FF6B6B] px-3 py-1.5 text-sm font-semibold text-white opacity-0 transition hover:bg-[#FF5252] group-hover:opacity-100 shadow"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}












