import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware: 페이지 및 API 경로 접근 권한을 공통으로 제어하는 보초병 역할을 수행합니다.
 */
export function middleware(request: NextRequest) {
  // 1. 요청 경로(Pathname)와 현재 로그인 쿠키 획득
  const requestPath = request.nextUrl.pathname;
  const authTokenCookie = request.cookies.get("auth_token");
  
  // 2. 인증이 면제되는 화이트리스트 경로 정의
  const isAuthPage = requestPath.startsWith("/login") || requestPath.startsWith("/register");
  const isAuthApi = requestPath.startsWith("/api/auth");
  const isNextStatic = requestPath.startsWith("/_next") || requestPath.includes("/favicon.ico");

  // 3. 비로그인 유저가 보호된 경로에 접근하려 할 때
  if (!authTokenCookie) {
    // 화이트리스트(정적 파일, 인증 페이지, 인증 API) 경로가 아님에도 로그인 없이 접근하려 한다면
    if (!isAuthPage && !isAuthApi && !isNextStatic) {
      // API 요청의 경우 401 Unauthorized 상태를 반환합니다.
      if (requestPath.startsWith("/api")) {
        return new NextResponse(
          JSON.stringify({ error: "인증되지 않은 사용자입니다. 로그인이 필요합니다." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      // 일반 페이지의 경우 로그인 화면(/login)으로 강제 리다이렉트합니다.
      const loginRedirectUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginRedirectUrl);
    }
  }

  // 4. 이미 로그인된 유저가 로그인/회원가입 페이지에 접근하려 할 때
  if (authTokenCookie && isAuthPage) {
    // 이미 열쇠가 있으므로, 메인 화면(/)으로 바로 튕겨 보냅니다.
    const homeRedirectUrl = new URL("/", request.url);
    return NextResponse.redirect(homeRedirectUrl);
  }

  // 5. 조건에 문제 없는 경우 다음 프로세스로 정상 통과시킵니다.
  return NextResponse.next();
}

/**
 * 미들웨어가 감시할 경로 매칭 설정
 */
export const config = {
  // api 경로 및 메인 페이지(/), 기타 서브 페이지를 감시 대상으로 맵핑
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
