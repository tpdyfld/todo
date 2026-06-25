import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 회원가입 API 엔드포인트 (POST /api/auth/register)
 */
export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { username, password } = requestBody;

    // 1. 입력 필드 정합성 검사
    if (!username || username.trim() === "" || !password || password.trim() === "") {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 모두 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // 2. 가입된 아이디의 중복 여부 검사
    const existingUser = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 가입되어 사용 중인 아이디입니다." },
        { status: 400 }
      );
    }

    // 3. 비밀번호 안전 해싱 (암호화)
    // bcryptjs 라이브러리를 이용하여 비밀번호를 단방향 암호문으로 안전하게 해싱합니다.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. 데이터베이스에 신규 사용자 계정 생성
    const newRegisteredUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
      },
    });

    // 5. 민감 정보(비밀번호)를 제외한 결과 응답
    return NextResponse.json(
      { 
        message: "회원가입이 성공적으로 완료되었습니다.",
        user: { id: newRegisteredUser.id, username: newRegisteredUser.username } 
      },
      { status: 201 }
    );
  } catch (serverError) {
    console.error("회원가입 처리 에러:", serverError);
    return NextResponse.json(
      { error: "회원가입 처리 중 서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
