import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * 로그인 및 쿠키 인증 토큰 발급 API 엔드포인트 (POST /api/auth/login)
 */
export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { username, password } = requestBody;

    // 1. 입력 필드 검증
    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    // 2. 가입된 사용자 계정 존재 여부 검사
    const dbUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "가입되지 않았거나 아이디 또는 비밀번호가 잘못되었습니다." },
        { status: 400 }
      );
    }

    // 3. 비밀번호 대조 및 검증
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordMatched) {
      return NextResponse.json(
        { error: "가입되지 않았거나 아이디 또는 비밀번호가 잘못되었습니다." },
        { status: 400 }
      );
    }

    // 4. JWT 토큰 발급
    const jwtToken = signToken({
      userId: dbUser.id,
      username: dbUser.username,
    });

    // 5. 로그인 성공 응답 빌드 및 HTTP-Only 쿠키 주입
    const response = NextResponse.json({
      message: "성공적으로 로그인되었습니다.",
      user: { id: dbUser.id, username: dbUser.username },
    });

    // 쿠키를 보안 설정과 함께 클라이언트에 전송합니다.
    // httpOnly: 자바스크립트(document.cookie)가 토큰을 훔쳐볼 수 없도록 막아 XSS 공격 방어
    // maxAge: 24시간 동안 토큰 유지
    response.cookies.set("auth_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1일 (초 단위)
    });

    return response;
  } catch (serverError) {
    console.error("로그인 처리 에러:", serverError);
    return NextResponse.json(
      { error: "로그인 처리 중 서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
