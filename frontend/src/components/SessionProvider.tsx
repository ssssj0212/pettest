"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * NextAuth SessionProvider 래퍼
 * 클라이언트 컴포넌트로 만들어서 layout.tsx에서 사용
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}









