import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 웹 애플리케이션의 SEO 향상을 위한 메타데이터 설정 (타이틀 및 설명)
export const metadata: Metadata = {
  title: "ToDo Planner - Next.js Todo App",
  description: "SQLite와 Next.js, Tailwind CSS로 만든 깔끔하고 사용하기 쉬운 할 일 관리(Todo) 웹 애플리케이션입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 다국어 설정을 위해 lang을 'ko'로 변경하고, 미려한 폰트와 렌더링 최적화 클래스 적용
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 부드러운 배경색과 서체 환경을 준비합니다. */}
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
