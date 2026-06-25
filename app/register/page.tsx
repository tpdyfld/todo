"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. 유효성 검사
    if (!username.trim() || !password || !confirmPassword) {
      setErrorMsg("모든 필드를 올바르게 입력해 주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "회원가입에 실패했습니다.");
      }

      setSuccessMsg("회원가입이 완료되었습니다! 3초 후 로그인 페이지로 이동합니다.");
      
      // 입력 폼 초기화
      setUsername("");
      setPassword("");
      setConfirmPassword("");

      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {
      setErrorMsg(err.message || "서버 통신 오류가 발생했습니다.");
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
            ToDo Planner 회원가입
          </h1>
          <p className="text-slate-500 text-sm">
            간단한 가입으로 나만의 스마트 할 일 사물함을 만들어 보세요.
          </p>
        </div>

        {/* 에러 및 성공 피드백 */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-semibold rounded-2xl animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-2xl">
            🎉 {successMsg}
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 pl-1" htmlFor="username-input">
              아이디
            </label>
            <input
              id="username-input"
              type="text"
              required
              placeholder="사용할 아이디를 입력하세요"
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
              placeholder="비밀번호 (4자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 pl-1" htmlFor="confirm-password-input">
              비밀번호 확인
            </label>
            <input
              id="confirm-password-input"
              type="password"
              required
              placeholder="비밀번호를 한번 더 입력해 주세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting || !username.trim() || !password || !confirmPassword}
            className={`w-full py-4 text-sm font-bold text-white rounded-2xl shadow-md transition-all duration-200 active:scale-95 mt-2 ${
              isSubmitting || !username.trim() || !password || !confirmPassword
                ? "bg-slate-300 shadow-none cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer shadow-blue-500/10"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                가입 진행 중...
              </span>
            ) : (
              "가입하기"
            )}
          </button>
        </form>

        {/* 로그인 페이지 이동 링크 */}
        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            이미 사물함이 있으신가요?{" "}
            <Link
              id="navigate-to-login-link"
              href="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              로그인 하기
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
