import { useState } from "react";
import { Product, ProductCreate, createProduct, updateProduct, deleteProduct } from "@/lib/api";

interface ProductsTabProps {
  products: Product[];
  onProductsChange: () => Promise<void>;
}

export function ProductsTab({ products, onProductsChange }: ProductsTabProps) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductCreate>({
    name: "",
    description: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await createProduct(productForm);
      }
      setProductForm({ name: "", description: "", price: "" });
      setEditingProduct(null);
      setShowProductForm(false);
      await onProductsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteProduct(id);
      await onProductsChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
    });
    setShowProductForm(true);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setProductForm({ name: "", description: "", price: "" });
    setShowProductForm(true);
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4A4A4A]">상품 관리</h2>
        <button
          onClick={handleAddClick}
          className="rounded-lg bg-[#FF6B6B] px-5 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
        >
          상품 추가
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
          {error}
        </div>
      )}

      {showProductForm && (
        <div className="rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
          <h3 className="mb-4 text-lg font-bold text-[#4A4A4A]">
            {editingProduct ? "상품 수정" : "상품 추가"}
          </h3>
          <form onSubmit={handleProductSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                상품명
              </label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
                className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                설명
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                가격
              </label>
              <input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
                required
                className="mt-1 w-full rounded-lg border border-[#F5E6D3] bg-[#FFF8F0] px-4 py-3 text-[#4A4A4A] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FFB88C] transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#FF6B6B] px-4 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-lg bg-[#FFF8F0] px-4 py-2.5 font-semibold text-[#8B7355] transition hover:bg-[#FFB88C] hover:text-white border border-[#F5E6D3]"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-8 text-[#8B7355]">
          등록된 상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-white p-6 shadow-warm border border-[#F5E6D3]"
            >
              <h3 className="font-bold text-[#4A4A4A]">{product.name}</h3>
              {product.description && (
                <p className="mt-2 text-sm text-[#8B7355] leading-relaxed">
                  {product.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-[#FF6B6B]">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="rounded-lg bg-[#FFB88C] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#FF8E53]"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-[#FF6B6B] transition hover:bg-[#FF6B6B] hover:text-white border border-[#FF6B6B]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
