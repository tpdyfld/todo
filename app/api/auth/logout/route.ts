import { NextResponse } from "next/server";

/**
 * 로그아웃 및 쿠키 삭제 API 엔드포인트 (POST /api/auth/logout)
 */
export async function POST() {
  try {
    const response = NextResponse.json({
      message: "성공적으로 로그아웃되었습니다.",
    });

    // 클라이언트 브라우저의 'auth_token' 쿠키를 즉시 만료 처리(삭제)합니다.
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // 만료 시간을 0초로 주어 즉시 쿠키 제거 유도
    });

    return response;
  } catch (error) {
    console.error("로그아웃 처리 에러:", error);
    return NextResponse.json(
      { error: "로그아웃 처리 중 서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
