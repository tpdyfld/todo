"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// 할 일(Todo) 데이터 인터페이스 정의
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  targetDate: string; // 할 일 등록 날짜 (포맷: YYYY-MM-DD)
  color: string;      // 테마 색상 (rose, blue, emerald, violet, slate)
  createdAt: string;
}

// 색상 프리셋 상수 정의 (Tailwind 클래스 매핑용)
const COLOR_PRESETS = [
  { id: "slate", name: "기본", bgClass: "bg-slate-500", borderClass: "border-slate-500", textClass: "text-slate-700", tintClass: "bg-slate-50/50 border-l-slate-500" },
  { id: "blue", name: "업무", bgClass: "bg-blue-500", borderClass: "border-blue-500", textClass: "text-blue-700", tintClass: "bg-blue-50/30 border-l-blue-500" },
  { id: "rose", name: "중요", bgClass: "bg-rose-500", borderClass: "border-rose-500", textClass: "text-rose-700", tintClass: "bg-rose-50/30 border-l-rose-500" },
  { id: "emerald", name: "개인", bgClass: "bg-emerald-500", borderClass: "border-emerald-500", textClass: "text-emerald-700", tintClass: "bg-emerald-50/30 border-l-emerald-500" },
  { id: "violet", name: "공부", bgClass: "bg-violet-500", borderClass: "border-violet-500", textClass: "text-violet-700", tintClass: "bg-violet-50/30 border-l-violet-500" },
];

export default function Home() {
  // --- 날짜 계산 헬퍼 함수 ---
  const getTodayString = () => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - timezoneOffset).toISOString().split('T')[0];
  };

  // --- 상태 관리 (State) ---
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ id: number; username: string } | null>(null);
  const [todoList, setTodoList] = useState<TodoItem[]>([]); // 데이터베이스 전체 할 일 목록
  const [newTodoText, setNewTodoText] = useState(""); // 할 일 입력창의 텍스트
  const [selectedDate, setSelectedDate] = useState(getTodayString()); // 달력에서 선택된 특정 날짜 (YYYY-MM-DD)
  const [selectedColor, setSelectedColor] = useState("slate"); // 신규 할 일 생성 시 선택한 색상

  // 달력 내비게이션 상태 (현재 달력에 노출되는 연도, 월)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0 ~ 11

  // 앱 로딩 및 오류 메시지 상태
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 더블 클릭 수정 기능 관련 상태
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // 싱글 클릭과 더블 클릭 간섭(레이스 컨디션)을 방지하기 위한 Ref 타이머
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 할 일 목록 필터 상태 (전체/진행 중/완료됨)
  const [currentFilter, setCurrentFilter] = useState<"all" | "active" | "completed">("all");

  // --- 로그인 유저 정보 조회 ---
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("유저 정보를 불러올 수 없습니다.");
      }
      const userData = await response.json();
      setUserProfile(userData);
    } catch (error) {
      console.error(error);
    }
  };

  // --- 로그아웃 처리 ---
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      } else {
        throw new Error("로그아웃 실패");
      }
    } catch (error) {
      console.error("로그아웃 에러:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // --- API 통신 함수 ---

  // 1. GET: 전체 할 일 조회
  const fetchTodoList = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/todos");
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("할 일 데이터를 가져오는 데 실패했습니다.");
      }
      const data: TodoItem[] = await response.json();
      setTodoList(data);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "서버 통신 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchTodoList();
  }, []);

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTodoId]);

  // 2. POST: 새로운 할 일 추가
  const addNewTodo = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanText = newTodoText.trim();
    if (cleanText === "") return;

    try {
      setErrorMessage(null);
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          targetDate: selectedDate, // 현재 선택한 날짜에 바인딩
          color: selectedColor,     // 선택한 색상 저장
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "할 일을 등록하지 못했습니다.");
      }

      setNewTodoText("");
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // 3. PATCH: 할 일 완료 여부 토글
  const toggleTodoCompletion = async (todoId: number, currentCompleted: boolean) => {
    try {
      setErrorMessage(null);
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (!response.ok) throw new Error("상태 변경에 실패했습니다.");
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // 4. PATCH: 특정 날짜의 모든 할 일 완료 여부 일괄 변경 (전체 선택/해제)
  const toggleAllTodosCompletion = async (isAllCompleted: boolean) => {
    if (selectedDateTodoList.length === 0) return;

    try {
      setErrorMessage(null);
      const response = await fetch(`/api/todos?targetDate=${selectedDate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: isAllCompleted }),
      });

      if (!response.ok) throw new Error("일정 전체 상태 변경에 실패했습니다.");
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // 5. PATCH: 더블클릭 수정 저장
  const saveEditedTodoText = async (todoId: number) => {
    const cleanText = editingTodoText.trim();
    if (cleanText === "") {
      setEditingTodoId(null);
      return;
    }

    try {
      setErrorMessage(null);
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });
      if (!response.ok) throw new Error("텍스트 수정에 실패했습니다.");
      setEditingTodoId(null);
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // 6. DELETE: 개별 삭제
  const deleteTodoItem = async (todoId: number) => {
    try {
      setErrorMessage(null);
      const response = await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("삭제를 완료하지 못했습니다.");
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // 7. DELETE: 선택한 날짜의 완료 항목 일괄 삭제 (Clear Completed for selected date)
  const clearCompletedTodos = async () => {
    const selectedDateCompletedTodos = todoList.filter(
      (todo) => todo.completed && todo.targetDate === selectedDate
    );
    if (selectedDateCompletedTodos.length === 0) return;

    try {
      setErrorMessage(null);
      const response = await fetch(`/api/todos?targetDate=${selectedDate}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("일괄 삭제를 완료하지 못했습니다.");
      await fetchTodoList();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  // --- 사용성 개선: 글자 클릭 및 더블 클릭 모드 분리 핸들러 ---
  
  // 텍스트 한 번 클릭 시: 220ms 지연 타이머를 두어 더블클릭과의 경합을 제어합니다.
  const handleTodoTextClick = (todoId: number, currentCompleted: boolean) => {
    if (clickTimeoutRef.current) {
      // 220ms 내에 두 번째 클릭이 들어왔다면(더블 클릭), 싱글 클릭 타이머를 무효화합니다.
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return;
    }

    // 싱글 클릭 타이머 작동
    clickTimeoutRef.current = setTimeout(() => {
      toggleTodoCompletion(todoId, currentCompleted);
      clickTimeoutRef.current = null;
    }, 220);
  };

  // 텍스트 더블클릭 시: 즉시 싱글 클릭 타이머를 취소하고 편집 상태로 돌입합니다.
  const handleTodoTextDoubleClick = (todoId: number, todoText: string) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    setEditingTodoId(todoId);
    setEditingTodoText(todoText);
  };

  // --- 달력 렌더링 헬퍼 로직 ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // 캘린더 날짜 그리드를 생성하는 코드
  const renderCalendarCells = () => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startOffset = startDayOfWeek(currentYear, currentMonth);

    const cells: React.ReactNode[] = [];

    // 1. 이전 달의 빈 공간 채우기
    const prevMonthDays = daysInMonth(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push(renderDayCell(dateString, dayNum, true));
    }

    // 2. 이번 달 날짜 채우기
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push(renderDayCell(dateString, dayNum, false));
    }

    // 3. 다음 달의 남은 공간 채우기 (7열 배수를 맞추기 위해)
    const totalRenderedCellsCount = cells.length;
    const remainingOffset = (7 - (totalRenderedCellsCount % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingOffset; dayNum++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push(renderDayCell(dateString, dayNum, true));
    }

    return cells;
  };

  // 개별 날짜 칸(Cell) 렌더링 함수
  const renderDayCell = (dateString: string, dayNumber: number, isDimmed: boolean) => {
    const isToday = getTodayString() === dateString;
    const isSelected = selectedDate === dateString;

    // 해당 날짜에 할당된 할 일 목록 추출
    const dayTodos = todoList.filter((todo) => todo.targetDate === dateString);

    return (
      <button
        key={dateString}
        id={`calendar-cell-${dateString}`}
        type="button"
        onClick={() => setSelectedDate(dateString)}
        className={`relative flex flex-col items-center justify-between p-2 h-16 border border-slate-50 transition-all rounded-xl focus:outline-none ${
          isDimmed ? "text-slate-300 dark:text-slate-700" : "text-slate-800 dark:text-slate-200"
        } ${
          isSelected 
            ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20 text-blue-800 shadow-sm" 
            : "hover:bg-slate-100/70"
        }`}
      >
        {/* 날짜 표시 */}
        <span 
          className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
            isToday && !isSelected ? "bg-blue-600 text-white shadow-sm" : ""
          }`}
        >
          {dayNumber}
        </span>

        {/* 할 일 요약 점(Dot) 표시 */}
        <div className="flex gap-0.5 justify-center w-full min-h-[6px] overflow-hidden mt-1 select-none">
          {dayTodos.slice(0, 3).map((todo) => {
            const preset = COLOR_PRESETS.find((p) => p.id === todo.color) || COLOR_PRESETS[0];
            return (
              <span
                key={todo.id}
                className={`w-1.5 h-1.5 rounded-full ${preset.bgClass} ${
                  todo.completed ? "opacity-30" : "opacity-90"
                }`}
              />
            );
          })}
          {dayTodos.length > 3 && (
            <span className="text-[8px] font-bold text-slate-400 leading-none">+</span>
          )}
        </div>
      </button>
    );
  };

  // --- 선택 날짜 기준 리스트 필터링 ---
  const selectedDateTodoList = todoList.filter((todo) => todo.targetDate === selectedDate);

  const filteredTodoList = selectedDateTodoList.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  const activeTodosCount = selectedDateTodoList.filter((todo) => !todo.completed).length;

  // 오늘 날짜 기준 모든 할 일이 전부 완료(전체 체크)되었는지 여부 검사
  const isEveryTodoCompleted = selectedDateTodoList.length > 0 && selectedDateTodoList.every((todo) => todo.completed);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
      {/* 타이틀 헤더 및 로그인 유저 정보 */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            ToDo Planner
          </h1>
          <p className="text-slate-500 text-sm font-normal">
            달력으로 한눈에 보고 원하는 날짜에 할 일을 스마트하게 계획해보세요.
          </p>
        </div>
        
        {/* 사용자 정보 및 로그아웃 버튼 (글래스모피즘 뱃지) */}
        {userProfile && (
          <div className="flex items-center gap-3 bg-white/60 border border-slate-200/60 shadow-sm px-4 py-2.5 rounded-2xl backdrop-blur-sm text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 font-bold">
              {userProfile.username}님
            </span>
            <span className="text-slate-300">|</span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition duration-150"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>

      {/* 에러 배너 */}
      {errorMessage && (
        <div 
          id="error-banner"
          className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center justify-between shadow-sm animate-fade-in"
        >
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button
            id="error-retry-btn"
            onClick={fetchTodoList}
            className="ml-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded-lg transition"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 2-컬럼 반응형 레이아웃 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* [왼쪽 컬럼] 달력 영역 (md 기준 7칸 점유) */}
        <section className="md:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {currentYear}년 {currentMonth + 1}월
            </h2>
            <div className="flex gap-1.5">
              <button
                id="calendar-prev-month-btn"
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                id="calendar-next-month-btn"
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 달력 요일 표시선 */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((dayName, idx) => (
              <span 
                key={dayName} 
                className={`text-xs font-semibold py-1 ${
                  idx === 0 ? "text-rose-500" : idx === 6 ? "text-blue-500" : "text-slate-400"
                }`}
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* 달력 본체 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarCells()}
          </div>
        </section>

        {/* [오른쪽 컬럼] 할 일 관리 영역 (md 기준 5칸 점유) */}
        <section className="md:col-span-5 flex flex-col gap-6">
          
          {/* 입력 폼 영역 */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-6">
            <h3 className="text-base font-bold text-slate-700 mb-4">
              📅 {selectedDate.split("-")[1]}월 {selectedDate.split("-")[2]}일에 할 일 추가
            </h3>

            <form onSubmit={addNewTodo} className="flex flex-col gap-4">
              {/* 할 일 텍스트 입력 */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white focus-within:border-transparent transition-all overflow-hidden">
                <input
                  id="todo-input"
                  type="text"
                  placeholder="새로운 할 일을 계획해 보세요..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="w-full py-4 pl-4 pr-16 bg-transparent text-slate-800 placeholder-slate-400 outline-none text-sm font-normal"
                />
                <button
                  id="todo-add-submit-btn"
                  type="submit"
                  disabled={newTodoText.trim() === ""}
                  className={`absolute right-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
                    newTodoText.trim() === ""
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer shadow-md"
                  }`}
                >
                  추가
                </button>
              </div>

              {/* 할 일 테마 색상 선택 */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-500">할 일 구분 색상</span>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = selectedColor === preset.id;
                    return (
                      <button
                        key={preset.id}
                        id={`color-picker-btn-${preset.id}`}
                        type="button"
                        onClick={() => setSelectedColor(preset.id)}
                        title={preset.name}
                        className={`w-8 h-8 rounded-full border transition-all ${preset.bgClass} ${
                          isSelected 
                            ? "ring-2 ring-offset-2 ring-blue-500 border-white scale-110 shadow-md" 
                            : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* 할 일 목록 출력 영역 */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
            
            {/* 리스트 헤더 필터 */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
              {(["all", "active", "completed"] as const).map((filterType) => {
                const isTabSelected = currentFilter === filterType;
                const filterLabelMap = { all: "전체", active: "진행 중", completed: "완료됨" };
                return (
                  <button
                    key={filterType}
                    id={`filter-tab-${filterType}`}
                    type="button"
                    onClick={() => setCurrentFilter(filterType)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      isTabSelected
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {filterLabelMap[filterType]}
                  </button>
                );
              })}
            </div>

            {/* [신규 기능] 하루 할 일 전체 완료 토글 영역 */}
            {selectedDateTodoList.length > 0 && (
              <div className="flex items-center px-4 py-2.5 bg-slate-50/20 border-b border-slate-100">
                <button
                  id="toggle-all-todos-btn"
                  type="button"
                  onClick={() => toggleAllTodosCompletion(!isEveryTodoCompleted)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition focus:outline-none"
                >
                  <span className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                    isEveryTodoCompleted ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isEveryTodoCompleted && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  하루 할 일 모두 완료 처리
                </button>
              </div>
            )}

            {/* 목록 내용 */}
            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto min-h-[120px]">
              {isLoading && todoList.length === 0 ? (
                <div id="loading-spinner-wrapper" className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-semibold">동기화 중...</p>
                </div>
              ) : filteredTodoList.length === 0 ? (
                <div id="empty-state-notice" className="text-center py-16 px-4">
                  <p className="text-2xl mb-1">📝</p>
                  <p className="text-slate-400 text-xs font-semibold">
                    {currentFilter === "all"
                      ? "이 날짜에 계획된 할 일이 없습니다."
                      : currentFilter === "active"
                      ? "진행 중인 일이 없습니다."
                      : "완료된 일이 없습니다."}
                  </p>
                </div>
              ) : (
                filteredTodoList.map((todo) => {
                  const isCurrentEditing = editingTodoId === todo.id;
                  const activePreset = COLOR_PRESETS.find((p) => p.id === todo.color) || COLOR_PRESETS[0];

                  return (
                    <div
                      key={todo.id}
                      id={`todo-item-container-${todo.id}`}
                      className={`flex items-center justify-between p-4 group transition-colors border-l-4 ${activePreset.tintClass} ${
                        todo.completed ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0 mr-3">
                        
                        {/* 완료 체크박스 */}
                        <button
                          id={`todo-checkbox-toggle-${todo.id}`}
                          type="button"
                          onClick={() => toggleTodoCompletion(todo.id, todo.completed)}
                          className={`w-5.5 h-5.5 mr-3 rounded-full border flex items-center justify-center transition focus:outline-none ${
                            todo.completed
                              ? `${activePreset.bgClass} ${activePreset.borderClass} text-white`
                              : `border-slate-300 bg-white hover:${activePreset.borderClass}`
                          }`}
                        >
                          {todo.completed && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* 텍스트 표기 (클릭 시 토글, 더블클릭 시 편집 모드 작동) */}
                        {isCurrentEditing ? (
                          <input
                            ref={editInputRef}
                            id={`todo-text-edit-input-${todo.id}`}
                            type="text"
                            value={editingTodoText}
                            onChange={(e) => setEditingTodoText(e.target.value)}
                            onBlur={() => saveEditedTodoText(todo.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditedTodoText(todo.id);
                              if (e.key === "Escape") setEditingTodoId(null);
                            }}
                            className="flex-1 py-0.5 px-2 border border-blue-500 rounded-lg outline-none text-slate-800 text-sm"
                          />
                        ) : (
                          <span
                            id={`todo-text-display-${todo.id}`}
                            onClick={() => handleTodoTextClick(todo.id, todo.completed)}
                            onDoubleClick={() => handleTodoTextDoubleClick(todo.id, todo.text)}
                            title="클릭하여 완료 토글 / 더블클릭하여 수정"
                            className={`flex-1 truncate text-sm font-medium cursor-pointer select-none py-0.5 transition-all ${
                              todo.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        id={`todo-delete-btn-${todo.id}`}
                        type="button"
                        onClick={() => deleteTodoItem(todo.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                        title="할 일 삭제"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                    </div>
                  );
                })
              )}
            </div>

            {/* 하단 푸터 (남은 일수, 일괄 완료 삭제) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <span id="active-todos-count">
                선택된 날의 남은 일: {activeTodosCount}개
              </span>

              <button
                id="clear-completed-btn"
                type="button"
                onClick={clearCompletedTodos}
                className="text-slate-400 hover:text-rose-600 transition focus:outline-none"
                title="선택한 날짜의 완료된 항목들을 일괄 삭제합니다."
              >
                완료 항목 전체 삭제
              </button>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}
