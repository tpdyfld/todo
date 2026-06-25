import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// 1. GET: 로그인한 사용자의 할 일 목록만 최근 생성된 순서대로 데이터베이스에서 조회합니다.
export async function GET(request: Request) {
  try {
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    // Prisma Client를 사용하여 해당 사용자의 Todo만 검색합니다.
    const todoItemsList = await prisma.todo.findMany({
      where: {
        userId: authenticatedUserId,
      },
      orderBy: {
        createdAt: "desc", // 최신 등록된 할 일이 리스트 맨 위에 보이도록 정렬
      },
    });

    return NextResponse.json(todoItemsList);
  } catch (databaseError) {
    console.error("할 일 목록 조회 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "할 일 목록을 가져오는 동안 서버에 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 2. POST: 로그인한 사용자용 새로운 할 일 정보(내용, 날짜, 테마 색상)를 받아서 데이터베이스에 추가합니다.
export async function POST(request: Request) {
  try {
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    const requestBody = await request.json();
    const todoContentText = requestBody.text;
    const todoColor = requestBody.color || "slate";
    
    let assignedDate = requestBody.targetDate;
    
    if (!assignedDate || assignedDate.trim() === "") {
      const todayDate = new Date();
      const timezoneOffset = todayDate.getTimezoneOffset() * 60000;
      assignedDate = new Date(todayDate.getTime() - timezoneOffset).toISOString().split('T')[0];
    }

    if (!todoContentText || todoContentText.trim() === "") {
      return NextResponse.json(
        { error: "할 일 내용은 비어있을 수 없습니다. 올바른 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 사용자 ID를 포함하여 데이터베이스에 할 일을 생성합니다.
    const newCreatedTodo = await prisma.todo.create({
      data: {
        text: todoContentText.trim(),
        completed: false,
        targetDate: assignedDate,
        color: todoColor,
        userId: authenticatedUserId, // 외래키로 관계 바인딩
      },
    });

    return NextResponse.json(newCreatedTodo, { status: 201 });
  } catch (databaseError) {
    console.error("새로운 할 일 등록 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "할 일을 데이터베이스에 추가하는 중 서버에 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 3. DELETE: 로그인한 사용자의 완료된 할 일을 일괄 삭제합니다 (Clear Completed).
export async function DELETE(request: Request) {
  try {
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDateFilter = searchParams.get("targetDate");

    // 로그인한 유저 본인의 Todo이면서 완료된 상태를 기본 필터로 설정합니다.
    const deleteFilterCondition: { completed: boolean; userId: number; targetDate?: string } = {
      completed: true,
      userId: authenticatedUserId,
    };

    if (targetDateFilter) {
      deleteFilterCondition.targetDate = targetDateFilter;
    }

    const deleteResult = await prisma.todo.deleteMany({
      where: deleteFilterCondition,
    });

    return NextResponse.json({
      message: `${deleteResult.count}개의 완료된 항목이 성공적으로 일괄 삭제되었습니다.`,
      count: deleteResult.count,
    });
  } catch (databaseError) {
    console.error("완료된 할 일 일괄 삭제 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "완료된 할 일 목록을 일괄 삭제하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 4. PATCH: 로그인한 사용자의 특정 날짜의 모든 할 일 완료 여부를 일괄 변경합니다 (전체 선택/해제).
export async function PATCH(request: Request) {
  try {
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDateFilter = searchParams.get("targetDate");

    if (!targetDateFilter || targetDateFilter.trim() === "") {
      return NextResponse.json(
        { error: "일괄 수정을 위해 목표 날짜(targetDate) 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
    const { completed } = requestBody;

    if (completed === undefined) {
      return NextResponse.json(
        { error: "일괄 수정할 완료 상태(completed) 값이 필요합니다." },
        { status: 400 }
      );
    }

    // 로그인한 유저 및 해당 날짜 조건으로 일괄 업데이트 수행
    const updateResult = await prisma.todo.updateMany({
      where: {
        userId: authenticatedUserId,
        targetDate: targetDateFilter,
      },
      data: {
        completed: completed,
      },
    });

    return NextResponse.json({
      message: `${updateResult.count}개의 할 일이 성공적으로 일괄 수정되었습니다.`,
      count: updateResult.count,
    });
  } catch (databaseError) {
    console.error("할 일 일괄 수정 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "할 일 목록을 일괄 수정하는 동안 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
