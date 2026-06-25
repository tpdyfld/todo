import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

/**
 * 현재 로그인한 사용자의 고유 정보(ID, 이름 등)를 조회하는 API 엔드포인트 (GET /api/auth/me)
 */
export async function GET(request: Request) {
  try {
    // 1. 요청의 쿠키 토큰에서 userId 분석 및 추출
    const authenticatedUserId = getUserIdFromRequest(request);

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "인증 세션이 유효하지 않거나 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. DB에서 유저 식별값에 해당하는 계정 정보 조회 (비밀번호 제외)
    const currentUser = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "존재하지 않는 유저 정보입니다." },
        { status: 404 }
      );
    }

    // 3. 사용자 정보 반환
    return NextResponse.json(currentUser);
  } catch (serverError) {
    console.error("로그인 세션 확인 중 오류 발생:", serverError);
    return NextResponse.json(
      { error: "세션 정보 조회 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
