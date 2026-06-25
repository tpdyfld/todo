import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// serverless 환경(WebSocket)에서도 연결이 원활하도록 ws 라이브러리를 Neon 설정에 연동합니다.
neonConfig.webSocketConstructor = ws;

// global 객체에서 prisma 변수를 참조하기 위한 전역 상태 인터페이스 정의
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Client 싱글톤 인스턴스 정의 변수
let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  // 이미 전역 객체에 생성된 인스턴스가 있다면 이를 재사용합니다.
  prismaInstance = globalForPrisma.prisma;
} else {
  // 1. DATABASE_URL 환경 변수가 정의되어 있는지 확인합니다.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 정의되지 않았습니다. .env 파일을 확인해 주세요.");
  }

  console.log("===> Prisma NeonDB 연동을 시작합니다.");

  // 2. Prisma Neon 어댑터를 생성할 때 연결 문자열을 직접 전달합니다.
  // Prisma 6.x 및 7.x에서는 Pool 객체 인스턴스를 주입하는 대신 설정 객체를 넘겨주는 방식이 표준입니다.
  const adapter = new PrismaNeon({ connectionString });

  // 3. 어댑터를 Prisma Client 생성자에 주입하여 클라이언트 인스턴스를 생성합니다.
  prismaInstance = new PrismaClient({
    adapter,
    log: ["query"], // SQL 디버그 로그 활성화
  });

  // 개발 모드에서 핫 리로딩(HMR)으로 인해 연결이 누수되는 것을 방지하기 위해 전역 객체에 등록합니다.
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
