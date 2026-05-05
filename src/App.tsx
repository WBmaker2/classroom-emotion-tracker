import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AppState,
  WEATHER_OPTIONS,
  WeatherType,
  calculateStats,
  getKoreanDateKey,
  getStudentHistory,
  getWeatherOption,
  resetTodayRecord,
  selectWeather,
  setTeacherPin,
  updateStudentCount,
  validatePin,
  verifyPin,
} from "./domain/weather";
import { loadAppState, saveAppState } from "./domain/storage";

type StudentGridProps = {
  state: AppState;
  todayKey: string;
  teacherMode: boolean;
  onSelectStudent: (studentNumber: number) => void;
};

type WeatherPickerModalProps = {
  studentNumber: number;
  onClose: () => void;
  onSelect: (weather: WeatherType) => void;
};

type TeacherPinModalProps = {
  hasPin: boolean;
  onClose: () => void;
  onSetPin: (pin: string, confirmation: string) => string | null;
  onUnlock: (pin: string) => string | null;
};

type TeacherPanelProps = {
  state: AppState;
  todayKey: string;
  showSettings: boolean;
  onToggleSettings: () => void;
  onStudentCountChange: (studentCount: number) => void;
  onResetToday: () => void;
  onChangeTeacherPin: (currentPin: string, nextPin: string, confirmation: string) => string | null;
};

const MOOD_LABELS: Record<WeatherType, string> = {
  sunny: "좋아요",
  cloudy: "조금 흐려요",
  rainy: "속상해요",
  stormy: "화가 나요/긴장돼요",
};

function formatDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function formatAccessibleDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function Header({
  todayKey,
  completed,
  total,
  onOpenTeacherMode,
}: {
  todayKey: string;
  completed: number;
  total: number;
  onOpenTeacherMode: () => void;
}) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">오늘의 교실 마음 날씨</p>
        <h1>우리 반 마음 날씨판</h1>
        <p className="header-meta">
          {todayKey} · {completed}/{total}명 참여
        </p>
      </div>
      <button
        type="button"
        className="teacher-button"
        aria-label="선생님 모드 열기"
        onClick={onOpenTeacherMode}
      >
        교사용
      </button>
    </header>
  );
}

function StatsBoard({ state, todayKey }: { state: AppState; todayKey: string }) {
  const stats = calculateStats(state, todayKey);
  const completionRate = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <section className="stats-section" aria-labelledby="stats-title">
      <div className="section-heading">
        <h2 id="stats-title">오늘 현황</h2>
        <span className="completion-pill">{completionRate}%</span>
      </div>
      <div className="stats-grid">
        {WEATHER_OPTIONS.map((option) => {
          const count = stats[option.value];
          return (
            <article className={`stat-card stat-${option.value}`} key={option.value}>
              <span className="stat-emoji" aria-hidden="true">
                {option.emoji}
              </span>
              <div>
                <h3>{option.label}</h3>
                <p>{count}명</p>
              </div>
            </article>
          );
        })}
        <article className="stat-card stat-missing">
          <span className="stat-emoji" aria-hidden="true">
            ○
          </span>
          <div>
            <h3>아직 선택 전</h3>
            <p>{stats.missing}명</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function StudentGrid({ state, todayKey, teacherMode, onSelectStudent }: StudentGridProps) {
  const todayRecord = state.records.find((record) => record.date === todayKey);
  const students = Array.from({ length: state.settings.studentCount }, (_, index) => index + 1);

  return (
    <section className="student-section" aria-labelledby="student-grid-title">
      <div className="section-heading">
        <h2 id="student-grid-title">학생 번호</h2>
        <p>번호를 눌러 오늘의 마음 날씨를 고릅니다.</p>
      </div>
      <div className="student-grid" aria-label="학생 번호 격자">
        {students.map((studentNumber) => {
          const weather = todayRecord?.entries[String(studentNumber)];
          const option = weather ? getWeatherOption(weather) : null;
          const buttonLabel =
            teacherMode && option
              ? `${studentNumber}번 ${option.emoji} ${option.label}`
              : weather
                ? `${studentNumber}번 선택 완료`
                : `${studentNumber}번 마음 날씨 선택`;

          return (
            <button
              type="button"
              className={`student-button ${weather ? "is-complete" : ""}`}
              aria-label={buttonLabel}
              key={studentNumber}
              onClick={() => onSelectStudent(studentNumber)}
            >
              <span className="student-number">{studentNumber}번</span>
              {teacherMode && option ? (
                <span className="student-weather" aria-hidden="true">
                  {option.emoji}
                </span>
              ) : (
                <span className="student-status" aria-hidden="true">
                  {weather ? "완료" : "대기"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeatherPickerModal({ studentNumber, onClose, onSelect }: WeatherPickerModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-picker-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{studentNumber}번</p>
            <h2 id="weather-picker-title">오늘 마음 날씨 고르기</h2>
          </div>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="weather-options">
          {WEATHER_OPTIONS.map((option) => (
            <button
              type="button"
              className={`weather-choice choice-${option.value}`}
              aria-label={`${option.emoji} ${MOOD_LABELS[option.value]} 선택`}
              key={option.value}
              onClick={() => onSelect(option.value)}
            >
              <span aria-hidden="true">{option.emoji}</span>
              <strong>{MOOD_LABELS[option.value]}</strong>
              <small>{option.label}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeacherPinModal({ hasPin, onClose, onSetPin, onUnlock }: TeacherPinModalProps) {
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = hasPin ? onUnlock(pin) : onSetPin(pin, confirmation);

    if (nextError) {
      setError(nextError);
      return;
    }

    setError("");
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal pin-modal" role="dialog" aria-modal="true" aria-labelledby="pin-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">교사용 잠금</p>
            <h2 id="pin-title">{hasPin ? "PIN 입력" : "처음 사용할 PIN 설정"}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="pin-form" onSubmit={handleSubmit}>
          <label htmlFor="teacher-pin">{hasPin ? "PIN" : "새 PIN"}</label>
          <input
            id="teacher-pin"
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            name="teacher-pin"
            pattern="[0-9]{4}"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
          {!hasPin ? (
            <>
              <label htmlFor="teacher-pin-confirmation">새 PIN 확인</label>
              <input
                id="teacher-pin-confirmation"
                autoComplete="off"
                inputMode="numeric"
                maxLength={4}
                name="teacher-pin-confirmation"
                pattern="[0-9]{4}"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="primary-action">
            {hasPin ? "잠금 해제" : "PIN 설정"}
          </button>
        </form>
      </section>
    </div>
  );
}

function TeacherPanel({
  state,
  todayKey,
  showSettings,
  onToggleSettings,
  onStudentCountChange,
  onResetToday,
  onChangeTeacherPin,
}: TeacherPanelProps) {
  const students = Array.from({ length: state.settings.studentCount }, (_, index) => index + 1);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmationPin, setConfirmationPin] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState("");

  function resetPinChangeFeedback() {
    setPinChangeError("");
    setPinChangeSuccess("");
  }

  function handlePinChangeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = onChangeTeacherPin(currentPin, nextPin, confirmationPin);

    if (nextError) {
      setPinChangeError(nextError);
      setPinChangeSuccess("");
      return;
    }

    setCurrentPin("");
    setNextPin("");
    setConfirmationPin("");
    setPinChangeError("");
    setPinChangeSuccess("PIN을 변경했어요.");
  }

  return (
    <section className="teacher-panel" aria-labelledby="teacher-panel-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">잠금 해제됨</p>
          <h2 id="teacher-panel-title">선생님 모드</h2>
        </div>
        <button
          type="button"
          className="secondary-action"
          aria-controls="teacher-settings"
          aria-expanded={showSettings}
          aria-label={showSettings ? "설정 닫기" : "설정 열기"}
          onClick={onToggleSettings}
        >
          {showSettings ? "설정 닫기" : "설정 열기"}
        </button>
      </div>

      {showSettings ? (
        <div className="settings-panel" id="teacher-settings">
          <label htmlFor="student-count">학급 인원</label>
          <input
            id="student-count"
            autoComplete="off"
            inputMode="numeric"
            min={1}
            max={40}
            name="student-count"
            type="number"
            value={state.settings.studentCount}
            onChange={(event) => onStudentCountChange(Number(event.target.value))}
          />
          <section aria-labelledby="pin-change-title">
            <div className="section-heading">
              <h3 id="pin-change-title">PIN 변경</h3>
            </div>
            <form className="pin-form" noValidate onSubmit={handlePinChangeSubmit}>
              <label htmlFor="current-pin">현재 PIN</label>
              <input
                id="current-pin"
                autoComplete="off"
                inputMode="numeric"
                maxLength={4}
                name="current-pin"
                pattern="[0-9]{4}"
                type="password"
                value={currentPin}
                onChange={(event) => {
                  resetPinChangeFeedback();
                  setCurrentPin(event.target.value);
                }}
              />
              <label htmlFor="next-pin">새 PIN</label>
              <input
                id="next-pin"
                autoComplete="off"
                inputMode="numeric"
                maxLength={4}
                name="next-pin"
                pattern="[0-9]{4}"
                type="password"
                value={nextPin}
                onChange={(event) => {
                  resetPinChangeFeedback();
                  setNextPin(event.target.value);
                }}
              />
              <label htmlFor="next-pin-confirmation">새 PIN 확인</label>
              <input
                id="next-pin-confirmation"
                autoComplete="off"
                inputMode="numeric"
                maxLength={4}
                name="next-pin-confirmation"
                pattern="[0-9]{4}"
                type="password"
                value={confirmationPin}
                onChange={(event) => {
                  resetPinChangeFeedback();
                  setConfirmationPin(event.target.value);
                }}
              />
              {pinChangeError ? (
                <p className="form-error" role="alert">
                  {pinChangeError}
                </p>
              ) : null}
              {pinChangeSuccess ? (
                <p className="form-success" role="status">
                  {pinChangeSuccess}
                </p>
              ) : null}
              <button type="submit" className="secondary-action">
                PIN 변경
              </button>
            </form>
          </section>
          <button type="button" className="danger-action" onClick={onResetToday}>
            오늘 기록 초기화
          </button>
        </div>
      ) : null}

      <div className="history-panel">
        <h3>학생별 7일 흐름</h3>
        <div className="history-list">
          {students.map((studentNumber) => {
            const history = getStudentHistory(state, studentNumber, todayKey);
            return (
              <article className="history-row" key={studentNumber}>
                <h4>{studentNumber}번</h4>
                <div className="history-cells" aria-label={`${studentNumber}번 7일 흐름`}>
                  {history.map((entry) => {
                    const option = entry.weather ? getWeatherOption(entry.weather) : null;
                    const accessibleLabel = `${formatAccessibleDateLabel(entry.date)} ${
                      option?.label ?? "기록 없음"
                    }`;
                    return (
                      <span
                        className={`history-cell ${entry.weather ? `cell-${entry.weather}` : ""}`}
                        role="img"
                        aria-label={accessibleLabel}
                        title={entry.weather ? option?.label : "기록 없음"}
                        key={entry.date}
                      >
                        <span aria-hidden="true">{option?.emoji ?? "·"}</span>
                        <small>{formatDateLabel(entry.date)}</small>
                      </span>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function App() {
  const todayKey = useMemo(() => getKoreanDateKey(), []);
  const [state, setState] = useState<AppState>(() => loadAppState(todayKey));
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [teacherMode, setTeacherMode] = useState(false);
  const [showTeacherPin, setShowTeacherPin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const stats = calculateStats(state, todayKey);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  function handleWeatherSelect(weather: WeatherType) {
    if (selectedStudent === null) {
      return;
    }

    setState((currentState) => selectWeather(currentState, selectedStudent, weather, todayKey));
    setSelectedStudent(null);
  }

  function handleSetPin(pin: string, confirmation: string): string | null {
    if (!validatePin(pin)) {
      return "PIN은 숫자 4자리로 입력해주세요.";
    }

    if (pin !== confirmation) {
      return "PIN 확인이 서로 달라요.";
    }

    setState((currentState) => setTeacherPin(currentState, pin));
    setTeacherMode(true);
    setShowTeacherPin(false);
    return null;
  }

  function handleUnlock(pin: string): string | null {
    if (!validatePin(pin)) {
      return "PIN은 숫자 4자리로 입력해주세요.";
    }

    if (!verifyPin(state, pin)) {
      return "PIN이 맞지 않아요.";
    }

    setTeacherMode(true);
    setShowTeacherPin(false);
    return null;
  }

  function handleChangeTeacherPin(
    currentPin: string,
    nextPin: string,
    confirmation: string,
  ): string | null {
    if (!validatePin(currentPin)) {
      return "현재 PIN은 숫자 4자리로 입력해주세요.";
    }

    if (!verifyPin(state, currentPin)) {
      return "현재 PIN이 맞지 않아요.";
    }

    if (!validatePin(nextPin)) {
      return "새 PIN은 숫자 4자리로 입력해주세요.";
    }

    if (nextPin !== confirmation) {
      return "새 PIN 확인이 서로 달라요.";
    }

    setState((currentState) => setTeacherPin(currentState, nextPin));
    return null;
  }

  function handleResetToday() {
    if (window.confirm("오늘 기록을 모두 초기화할까요?")) {
      setState((currentState) => resetTodayRecord(currentState, todayKey));
    }
  }

  return (
    <main className="app-shell">
      <Header
        todayKey={todayKey}
        completed={stats.completed}
        total={stats.total}
        onOpenTeacherMode={() => setShowTeacherPin(true)}
      />
      <StatsBoard state={state} todayKey={todayKey} />
      <StudentGrid
        state={state}
        teacherMode={teacherMode}
        todayKey={todayKey}
        onSelectStudent={setSelectedStudent}
      />
      {teacherMode ? (
        <TeacherPanel
          state={state}
          showSettings={showSettings}
          todayKey={todayKey}
          onResetToday={handleResetToday}
          onStudentCountChange={(studentCount) =>
            setState((currentState) => updateStudentCount(currentState, studentCount))
          }
          onChangeTeacherPin={handleChangeTeacherPin}
          onToggleSettings={() => setShowSettings((isVisible) => !isVisible)}
        />
      ) : null}
      {selectedStudent !== null ? (
        <WeatherPickerModal
          studentNumber={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSelect={handleWeatherSelect}
        />
      ) : null}
      {showTeacherPin ? (
        <TeacherPinModal
          hasPin={state.settings.teacherPin !== null}
          onClose={() => setShowTeacherPin(false)}
          onSetPin={handleSetPin}
          onUnlock={handleUnlock}
        />
      ) : null}
    </main>
  );
}

export default App;
