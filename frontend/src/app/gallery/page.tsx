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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">갤러리</h1>
          {isAdmin && (
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
              {showForm ? "취소" : "이미지 추가"}
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">이미지 추가</h2>

            {error && (
              <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="image_url"
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="caption"
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "추가 중..." : "이미지 추가"}
              </button>
            </form>
          </div>
        )}

        {gallery.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
            갤러리에 등록된 이미지가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={item.image_url}
                    alt={item.caption || "Gallery image"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {item.caption && (
                  <div className="p-4">
                    <p className="text-sm text-gray-700">{item.caption}</p>
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute right-2 top-2 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white opacity-0 transition hover:bg-red-700 group-hover:opacity-100"
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

