import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// 1. PATCH: 특정 할 일의 내용(text) 또는 완료 여부(completed)를 수정합니다.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. 사용자 세션 체크
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    const { id } = await params;
    const numericTodoId = parseInt(id, 10);

    if (isNaN(numericTodoId)) {
      return NextResponse.json(
        { error: "올바르지 않은 식별자(ID) 형식입니다." },
        { status: 400 }
      );
    }

    // 1. 해당 할 일이 존재하는지 및 소유권 검사
    const todoItem = await prisma.todo.findUnique({
      where: { id: numericTodoId },
    });

    if (!todoItem) {
      return NextResponse.json({ error: "존재하지 않는 할 일 아이템입니다." }, { status: 404 });
    }

    if (todoItem.userId !== authenticatedUserId) {
      return NextResponse.json({ error: "이 할 일을 수정할 권한이 없습니다." }, { status: 403 });
    }

    // 2. 요청 본문에서 업데이트할 필드들을 가져옵니다.
    const requestBody = await request.json();
    const { text, completed, targetDate, color } = requestBody;

    const dataToUpdate: { 
      text?: string; 
      completed?: boolean;
      targetDate?: string;
      color?: string;
    } = {};

    if (text !== undefined) {
      if (text.trim() === "") {
        return NextResponse.json(
          { error: "수정할 할 일 내용은 비어있을 수 없습니다." },
          { status: 400 }
        );
      }
      dataToUpdate.text = text.trim();
    }

    if (completed !== undefined) {
      dataToUpdate.completed = completed;
    }

    if (targetDate !== undefined) {
      dataToUpdate.targetDate = targetDate.trim();
    }

    if (color !== undefined) {
      dataToUpdate.color = color.trim();
    }

    // 3. 데이터베이스 수정 수행
    const updatedTodoItem = await prisma.todo.update({
      where: { id: numericTodoId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedTodoItem);
  } catch (databaseError) {
    console.error("할 일 수정 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "할 일을 수정하는 동안 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 2. DELETE: 특정 id의 할 일을 데이터베이스에서 삭제합니다.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. 사용자 세션 체크
    const authenticatedUserId = getUserIdFromRequest(request);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "인증되지 않은 유저 요청입니다." }, { status: 401 });
    }

    const { id } = await params;
    const numericTodoId = parseInt(id, 10);

    if (isNaN(numericTodoId)) {
      return NextResponse.json(
        { error: "올바르지 않은 식별자(ID) 형식입니다." },
        { status: 400 }
      );
    }

    // 1. 해당 할 일이 존재하는지 및 소유권 검사
    const todoItem = await prisma.todo.findUnique({
      where: { id: numericTodoId },
    });

    if (!todoItem) {
      return NextResponse.json({ error: "존재하지 않는 할 일 아이템입니다." }, { status: 404 });
    }

    if (todoItem.userId !== authenticatedUserId) {
      return NextResponse.json({ error: "이 할 일을 삭제할 권한이 없습니다." }, { status: 403 });
    }

    // 2. 데이터베이스에서 해당 레코드 삭제
    const deletedTodoItem = await prisma.todo.delete({
      where: { id: numericTodoId },
    });

    return NextResponse.json({
      message: "할 일이 성공적으로 삭제되었습니다.",
      deletedItem: deletedTodoItem,
    });
  } catch (databaseError) {
    console.error("할 일 삭제 중 오류 발생:", databaseError);
    return NextResponse.json(
      { error: "할 일을 삭제하는 동안 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
