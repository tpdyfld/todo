"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "로그인에 실패했습니다.");
      }

      // 로그인 성공 시 메인 화면으로 이동
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "서버와의 통신에 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-100 via-blue-50 to-indigo-100 px-4 py-12">
      {/* 글래스모피즘 카드 레이아웃 */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-8 md:p-10 transition-all duration-300 hover:shadow-2xl">
        
        {/* 타이틀 영역 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            ToDo Planner 로그인
          </h1>
          <p className="text-slate-500 text-sm">
            개인용 할 일 관리 사물함에 입장해 보세요.
          </p>
        </div>

        {/* 에러 피드백 */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-semibold rounded-2xl animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 pl-1" htmlFor="username-input">
              아이디
            </label>
            <input
              id="username-input"
              type="text"
              required
              placeholder="아이디를 입력해 주세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 pl-1" htmlFor="password-input">
              비밀번호
            </label>
            <input
              id="password-input"
              type="password"
              required
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting || !username.trim() || !password}
            className={`w-full py-4 text-sm font-bold text-white rounded-2xl shadow-md transition-all duration-200 active:scale-95 mt-2 ${
              isSubmitting || !username.trim() || !password
                ? "bg-slate-300 shadow-none cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer shadow-blue-500/10"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        {/* 회원가입 이동 링크 */}
        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            아직 사물함이 없으신가요?{" "}
            <Link
              id="navigate-to-register-link"
              href="/register"
              className="text-blue-600 font-bold hover:underline"
            >
              회원가입 하기
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
