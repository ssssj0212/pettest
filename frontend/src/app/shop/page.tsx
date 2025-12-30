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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">용품 쇼핑</h1>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            장바구니
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {showCart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">장바구니</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500">장바구니가 비어있습니다.</p>
              ) : (
                <>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-600">
                            ${parseFloat(item.product.price).toFixed(2)} ×{" "}
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="rounded bg-gray-200 px-2 py-1 text-sm"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="rounded bg-gray-200 px-2 py-1 text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-4 flex justify-between text-lg font-semibold">
                      <span>총액</span>
                      <span>${getTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold">결제 방법 선택</h2>

              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="CARD"
                    checked={paymentMethod === "CARD"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                  />
                  <span>카드 결제 (Stripe)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="VENMO"
                    checked={paymentMethod === "VENMO"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                  />
                  <span>Venmo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="CASH"
                    checked={paymentMethod === "CASH"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "CARD" | "VENMO" | "CASH")
                    }
                  />
                  <span>현금 (현장 결제)</span>
                </label>
              </div>

              <div className="mb-4 flex justify-between text-lg font-semibold">
                <span>총액</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? "처리 중..." : "결제하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full rounded-lg bg-white p-8 text-center text-gray-500 shadow">
              등록된 상품이 없습니다.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
              >
                <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                {product.description && (
                  <p className="mb-3 text-sm text-gray-600">{product.description}</p>
                )}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
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




