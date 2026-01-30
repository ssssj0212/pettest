import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * POST /api/logout
 * 서버에서 JWT에 저장된 id_token으로 백엔드 /logout 호출 후 로그아웃 처리
 */
export async function POST(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const idToken = token?.idToken as string | undefined;
    if (!idToken) {
      return NextResponse.json(
        { message: "세션에 id_token이 없습니다." },
        { status: 401 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend logout failed:", res.status, text);
      // 백엔드 실패해도 클라이언트 로그아웃은 진행
    }

    return NextResponse.json({ message: "로그아웃 성공" });
  } catch (e) {
    console.error("Logout API error:", e);
    return NextResponse.json(
      { message: "로그아웃 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
