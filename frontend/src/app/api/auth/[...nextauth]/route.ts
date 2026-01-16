import { handlers } from "@/auth";

/**
 * NextAuth Route Handler
 * 
 * 이 파일은 NextAuth의 API 라우트 핸들러입니다.
 * App Router 기준으로 [...nextauth] 동적 라우트를 사용합니다.
 * 
 * 엔드포인트:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET /api/auth/callback/google
 * - GET /api/auth/session
 * 등등
 */
export const { GET, POST } = handlers;

