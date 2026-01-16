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
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google 로그인 성공 시 처리
      // 여기서 FastAPI 백엔드로 사용자 정보를 전송하여
      // 기존 사용자면 로그인, 신규 사용자면 회원가입 처리 가능
      
      // TODO: FastAPI 백엔드와 연동
      // 예: await fetch(`${BACKEND_URL}/auth/google`, { ... })
      
      return true;
    },
    async jwt({ token, user, account }) {
      // JWT 토큰 커스터마이징
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션 커스터마이징
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

