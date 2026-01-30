import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth (Auth.js) 설정 파일
 *
 * 환경변수 필요:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - NEXTAUTH_URL
 * - NEXTAUTH_SECRET
 * - BACKEND_URL (백엔드 API URL)
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1일 (86400초)
    updateAge: 60 * 60, // 1시간마다 세션 갱신
  },

  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      try {
        console.log("🔐 signIn 콜백 시작:", user.email);

        // 1. 이메일 확인
        const email = user.email;
        if (!email) {
          console.error("❌ 이메일 정보가 없습니다.");
          return false;
        }

        // 2. 이메일 도메인 제한 (옵션)
        const allowedDomains =
          process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
        if (allowedDomains.length > 0) {
          const domain = email.split("@")[1];
          if (!allowedDomains.includes(domain)) {
            console.warn(`❌ Rejected login from domain: ${domain}`);
            return false;
          }
        }

        // 3. 백엔드에 사용자 확인 (자동 생성 및 로그인 상태 업데이트)
        const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
        console.log("📡 백엔드 호출:", `${backendUrl}/me`);

        const bearer =
          account?.id_token ?? account?.access_token ?? undefined;
        if (!bearer) {
          console.error("❌ Google token(id_token/access_token)을 찾을 수 없습니다.");
          // 개발 환경에서는 계속 진행 (백엔드 연결 실패해도)
          if (process.env.NODE_ENV === "development") return true;
          return false;
        }

        const response = await fetch(`${backendUrl}/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        });

        if (!response.ok) {
          console.error("❌ Backend user verification failed:", response.status);
          // 개발 환경에서는 계속 진행 (백엔드 연결 실패해도)
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ 개발 환경: 백엔드 연결 실패해도 로그인 허용");
            return true;
          }
          return false;
        }

        const dbUser = await response.json();
        console.log("✅ DB 사용자 확인:", dbUser.email, "role:", dbUser.role);

        // 4. 비활성 사용자 차단
        if (!dbUser.is_active) {
          console.warn(`❌ Rejected inactive user: ${email}`);
          return false;
        }

        console.log("✅ signIn 성공!");
        return true;
      } catch (error) {
        console.error("❌ signIn callback error:", error);
        // 개발 환경에서는 에러가 발생해도 로그인 허용
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ 개발 환경: 에러 발생해도 로그인 허용");
          return true;
        }

        return false;
      }
    },

    async jwt({ token, user, account }) {
      // JWT 토큰 커스터마이징 (세션에는 민감 정보 노출 안 함)
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token; // 로그아웃 시 백엔드 호출용(세션에는 넣지 않음)
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      // ✅ 세션에는 민감한 정보 제외 (accessToken 제거)
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },

  // ✅ 로그아웃 시 백엔드 /logout 호출 (lastLogoutAt 업데이트)
  // - 토큰 값 출력 금지 준수: 콘솔에 토큰 찍지 않음
  // - 실패해도 signOut 자체는 진행(UX 우선)
  events: {
    async signOut(message) {
      try {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
        const idToken =
          (message as any)?.token?.idToken ||
          (message as any)?.token?.accessToken;

        if (!idToken) return;

        await fetch(`${backendUrl}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch {
        // ignore
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: false,
});
