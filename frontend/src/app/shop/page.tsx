"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProducts,
  createOrder,
  processPayment,
  getToken,
  type Product,
} from "@/lib/api";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "VENMO" | "CASH">("CARD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("상품 로드 실패:", err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (cart.length === 0) {
      setError("장바구니가 비어있습니다.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const order = await createOrder({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      });

      // 결제 처리
      const paymentResult = await processPayment(order.id, paymentMethod);

      if (paymentMethod === "CASH") {
        alert("현금 결제가 완료되었습니다!");
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
      } else if (paymentMethod === "VENMO") {
        if (paymentResult.payment_url) {
          window.open(paymentResult.payment_url, "_blank");
        }
        alert("Venmo 결제 페이지로 이동합니다.");
      } else if (paymentMethod === "CARD") {
        // TODO: Stripe 결제 처리
        alert("카드 결제는 Stripe 연동이 필요합니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8F0] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[#FF6B6B]">용품 쇼핑</h1>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative rounded-lg bg-[#FF6B6B] px-5 py-2.5 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
          >
            장바구니
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF8E53] text-xs font-bold text-white shadow">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#FF6B6B] border border-red-200">
            {error}
          </div>
        )}

        {showCart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#FF6B6B]">장바구니</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-[#8B7355] hover:text-[#FF6B6B] transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-[#8B7355] text-center py-8">장바구니가 비어있습니다.</p>
              ) : (
                <>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between rounded-xl border border-[#F5E6D3] p-4 bg-[#FFF8F0]"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-[#4A4A4A]">{item.product.name}</div>
                          <div className="text-sm text-[#8B7355] mt-1">
                            ${parseFloat(item.product.price).toFixed(2)} ×{" "}
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="rounded-lg bg-white border border-[#F5E6D3] px-3 py-1 text-sm text-[#4A4A4A] hover:bg-[#FFB88C] hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="font-medium text-[#4A4A4A] min-w-[24px] text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="rounded-lg bg-white border border-[#F5E6D3] px-3 py-1 text-sm text-[#4A4A4A] hover:bg-[#FFB88C] hover:text-white transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-[#FF6B6B] hover:text-[#FF5252] transition-colors text-sm font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-[#F5E6D3] pt-4">
                    <div className="mb-4 flex justify-between text-xl font-bold text-[#4A4A4A]">
                      <span>총액</span>
                      <span className="text-[#FF6B6B]">${getTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
                    >
                      결제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-warm-lg border border-[#F5E6D3]">
              <h2 className="mb-6 text-2xl font-bold text-[#FF6B6B]">결제 방법 선택</h2>

              <div className="mb-6 space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#F5E6D3] hover:bg-[#FFF8F0] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value="CARD"
                    checked={paymentMethod === "CARD"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                    className="text-[#FF6B6B] focus:ring-[#FFB88C]"
                  />
                  <span className="text-[#4A4A4A] font-medium">카드 결제 (Stripe)</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#F5E6D3] hover:bg-[#FFF8F0] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value="VENMO"
                    checked={paymentMethod === "VENMO"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                    className="text-[#FF6B6B] focus:ring-[#FFB88C]"
                  />
                  <span className="text-[#4A4A4A] font-medium">Venmo</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#F5E6D3] hover:bg-[#FFF8F0] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value="CASH"
                    checked={paymentMethod === "CASH"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                    className="text-[#FF6B6B] focus:ring-[#FFB88C]"
                  />
                  <span className="text-[#4A4A4A] font-medium">현금 (현장 결제)</span>
                </label>
              </div>

              <div className="mb-6 flex justify-between text-xl font-bold text-[#4A4A4A] border-t border-[#F5E6D3] pt-4">
                <span>총액</span>
                <span className="text-[#FF6B6B]">${getTotal().toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 rounded-lg bg-[#FFF8F0] px-4 py-3 font-semibold text-[#8B7355] transition hover:bg-[#FFB88C] hover:text-white"
                >
                  취소
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] disabled:bg-[#FFB88C] disabled:cursor-not-allowed shadow-warm"
                >
                  {loading ? "처리 중..." : "결제하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white p-12 text-center text-[#8B7355] shadow-warm border border-[#F5E6D3]">
              등록된 상품이 없습니다.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-white p-6 shadow-warm transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1 border border-[#F5E6D3]"
              >
                <h3 className="mb-2 text-xl font-bold text-[#4A4A4A]">{product.name}</h3>
                {product.description && (
                  <p className="mb-4 text-sm text-[#8B7355] leading-relaxed">{product.description}</p>
                )}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#FF6B6B]">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full rounded-lg bg-[#FF6B6B] px-4 py-3 font-semibold text-white transition hover:bg-[#FF5252] shadow-warm"
                >
                  장바구니에 추가
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}












