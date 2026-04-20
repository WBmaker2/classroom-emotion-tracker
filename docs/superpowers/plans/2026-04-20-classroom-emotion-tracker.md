# Classroom Emotion Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only React app where students select a weather emoji for today’s mood, teachers see class-level stats by default, and PIN-protected teacher mode reveals individual and 7-day history.

**Architecture:** Use a Vite React TypeScript app with pure domain functions for weather records, localStorage persistence, and component-driven UI. All private emotion data stays in browser localStorage; the UI renders general stats by default and reveals individual weather only after PIN unlock.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, Playwright, and one global stylesheet.

---

## Current Workspace Note

This workspace was not a Git repository when this plan was written. Commit steps use a guarded command that commits only if `.git` exists; otherwise they print `not a git repository; commit skipped`.

## File Structure

- Create `package.json`: npm scripts and dependencies.
- Create `index.html`: Vite entry document.
- Create `vite.config.ts`: Vite and Vitest config.
- Create `tsconfig.json`: TypeScript compiler config.
- Create `src/main.tsx`: React mount point.
- Create `src/App.tsx`: App state orchestration and screen composition.
- Create `src/styles.css`: layout, responsive UI, focus states, motion preferences.
- Create `src/domain/weather.ts`: pure data model, record updates, stats, date helpers, PIN validation.
- Create `src/domain/storage.ts`: localStorage load/save wrapper.
- Create `src/domain/weather.test.ts`: unit tests for domain logic.
- Create `src/App.test.tsx`: user-flow tests for the app.
- Create `src/test/setup.ts`: Vitest DOM matchers.
- Create `playwright.config.ts`: Playwright dev-server config.
- Create `tests/classroom-emotion-tracker.spec.ts`: Playwright smoke test.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "classroom-emotion-tracker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@vitejs/plugin-react": "^5.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f8fbff" />
    <title>우리 반 마음 날씨 예보관</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript and Vite config files**

`vite.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Create test setup**

`src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 6: Run the empty test command**

Run:

```bash
npm test -- --passWithNoTests
```

Expected: PASS with no test files found.

- [ ] **Step 7: Commit foundation if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add package.json package-lock.json index.html vite.config.ts tsconfig.json src/test/setup.ts && git commit -m "chore: set up classroom tracker app" || echo "not a git repository; commit skipped"
```

---

### Task 2: Domain Logic With Tests

**Files:**
- Create: `src/domain/weather.test.ts`
- Create: `src/domain/weather.ts`

- [ ] **Step 1: Write failing domain tests**

`src/domain/weather.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  buildRecentDateKeys,
  calculateStats,
  createDefaultState,
  getStudentHistory,
  pruneOldRecords,
  resetTodayRecord,
  selectWeather,
  setTeacherPin,
  updateStudentCount,
  validatePin,
  verifyPin,
} from "./weather";

describe("weather domain", () => {
  it("creates the default classroom state", () => {
    const state = createDefaultState();

    expect(state.settings.studentCount).toBe(20);
    expect(state.settings.teacherPin).toBeNull();
    expect(state.records).toEqual([]);
  });

  it("validates student count boundaries", () => {
    let state = createDefaultState();

    state = updateStudentCount(state, 0);
    expect(state.settings.studentCount).toBe(1);

    state = updateStudentCount(state, 41);
    expect(state.settings.studentCount).toBe(40);

    state = updateStudentCount(state, 24);
    expect(state.settings.studentCount).toBe(24);
  });

  it("records and replaces today's weather selection", () => {
    const today = "2026-04-20";
    let state = createDefaultState();

    state = selectWeather(state, 3, "rainy", today);
    expect(state.records[0].entries["3"]).toBe("rainy");

    state = selectWeather(state, 3, "sunny", today);
    expect(state.records[0].entries["3"]).toBe("sunny");
    expect(state.records).toHaveLength(1);
  });

  it("calculates stats for the current class size only", () => {
    const today = "2026-04-20";
    let state = updateStudentCount(createDefaultState(), 3);
    state = selectWeather(state, 1, "sunny", today);
    state = selectWeather(state, 2, "stormy", today);
    state = selectWeather(state, 5, "rainy", today);

    expect(calculateStats(state, today)).toEqual({
      sunny: 1,
      cloudy: 0,
      rainy: 0,
      stormy: 1,
      missing: 1,
      total: 3,
      completed: 2,
    });
  });

  it("keeps only the last seven date keys", () => {
    expect(buildRecentDateKeys("2026-04-20")).toEqual([
      "2026-04-14",
      "2026-04-15",
      "2026-04-16",
      "2026-04-17",
      "2026-04-18",
      "2026-04-19",
      "2026-04-20",
    ]);
  });

  it("prunes records older than seven days", () => {
    const state = {
      ...createDefaultState(),
      records: [
        { date: "2026-04-12", entries: { "1": "sunny" as const } },
        { date: "2026-04-14", entries: { "1": "cloudy" as const } },
        { date: "2026-04-20", entries: { "1": "rainy" as const } },
      ],
    };

    expect(pruneOldRecords(state, "2026-04-20").records.map((record) => record.date)).toEqual([
      "2026-04-14",
      "2026-04-20",
    ]);
  });

  it("returns a student's seven-day history", () => {
    let state = createDefaultState();
    state = selectWeather(state, 2, "cloudy", "2026-04-18");
    state = selectWeather(state, 2, "stormy", "2026-04-20");

    expect(getStudentHistory(state, 2, "2026-04-20")).toEqual([
      { date: "2026-04-14", weather: null },
      { date: "2026-04-15", weather: null },
      { date: "2026-04-16", weather: null },
      { date: "2026-04-17", weather: null },
      { date: "2026-04-18", weather: "cloudy" },
      { date: "2026-04-19", weather: null },
      { date: "2026-04-20", weather: "stormy" },
    ]);
  });

  it("validates and verifies teacher PINs", () => {
    expect(validatePin("1234")).toBe(true);
    expect(validatePin("123")).toBe(false);
    expect(validatePin("abcd")).toBe(false);

    const state = setTeacherPin(createDefaultState(), "2468");
    expect(verifyPin(state, "2468")).toBe(true);
    expect(verifyPin(state, "1357")).toBe(false);
  });

  it("resets today's record", () => {
    let state = selectWeather(createDefaultState(), 1, "sunny", "2026-04-20");
    state = resetTodayRecord(state, "2026-04-20");

    expect(calculateStats(state, "2026-04-20").completed).toBe(0);
  });
});
```

- [ ] **Step 2: Run the failing domain tests**

Run:

```bash
npm test -- src/domain/weather.test.ts
```

Expected: FAIL because `src/domain/weather.ts` does not exist.

- [ ] **Step 3: Implement the pure domain module**

`src/domain/weather.ts`

```ts
export const WEATHER_OPTIONS = [
  { id: "sunny", emoji: "☀️", label: "좋아요", shortLabel: "맑음" },
  { id: "cloudy", emoji: "⛅", label: "조금 흐려요", shortLabel: "구름" },
  { id: "rainy", emoji: "🌧️", label: "속상해요", shortLabel: "비" },
  { id: "stormy", emoji: "⚡", label: "화가 나요/긴장돼요", shortLabel: "번개" },
] as const;

export type WeatherType = (typeof WEATHER_OPTIONS)[number]["id"];

export type DailyWeatherRecord = {
  date: string;
  entries: Record<string, WeatherType>;
};

export type AppSettings = {
  studentCount: number;
  teacherPin: string | null;
};

export type AppState = {
  settings: AppSettings;
  records: DailyWeatherRecord[];
};

export type WeatherStats = Record<WeatherType, number> & {
  missing: number;
  total: number;
  completed: number;
};

export type StudentHistoryEntry = {
  date: string;
  weather: WeatherType | null;
};

const MIN_STUDENT_COUNT = 1;
const MAX_STUDENT_COUNT = 40;
const RECENT_DAY_COUNT = 7;

export function createDefaultState(): AppState {
  return {
    settings: {
      studentCount: 20,
      teacherPin: null,
    },
    records: [],
  };
}

export function getKoreanDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function updateStudentCount(state: AppState, count: number): AppState {
  const safeCount = Number.isFinite(count) ? Math.round(count) : state.settings.studentCount;
  const studentCount = Math.min(MAX_STUDENT_COUNT, Math.max(MIN_STUDENT_COUNT, safeCount));

  return {
    ...state,
    settings: {
      ...state.settings,
      studentCount,
    },
  };
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function setTeacherPin(state: AppState, pin: string): AppState {
  if (!validatePin(pin)) {
    return state;
  }

  return {
    ...state,
    settings: {
      ...state.settings,
      teacherPin: pin,
    },
  };
}

export function verifyPin(state: AppState, pin: string): boolean {
  return state.settings.teacherPin !== null && state.settings.teacherPin === pin;
}

export function selectWeather(
  state: AppState,
  studentNumber: number,
  weather: WeatherType,
  dateKey: string,
): AppState {
  const studentKey = String(studentNumber);
  const existingRecord = state.records.find((record) => record.date === dateKey);
  const nextRecord: DailyWeatherRecord = {
    date: dateKey,
    entries: {
      ...(existingRecord?.entries ?? {}),
      [studentKey]: weather,
    },
  };

  return {
    ...state,
    records: [
      ...state.records.filter((record) => record.date !== dateKey),
      nextRecord,
    ].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function resetTodayRecord(state: AppState, dateKey: string): AppState {
  return {
    ...state,
    records: state.records.filter((record) => record.date !== dateKey),
  };
}

export function calculateStats(state: AppState, dateKey: string): WeatherStats {
  const record = state.records.find((item) => item.date === dateKey);
  const stats: WeatherStats = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    stormy: 0,
    missing: 0,
    total: state.settings.studentCount,
    completed: 0,
  };

  for (let studentNumber = 1; studentNumber <= state.settings.studentCount; studentNumber += 1) {
    const weather = record?.entries[String(studentNumber)];

    if (weather) {
      stats[weather] += 1;
      stats.completed += 1;
    } else {
      stats.missing += 1;
    }
  }

  return stats;
}

export function buildRecentDateKeys(todayKey: string): string[] {
  const today = dateKeyToUtcDate(todayKey);
  const keys: string[] = [];

  for (let offset = RECENT_DAY_COUNT - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    keys.push(utcDateToDateKey(date));
  }

  return keys;
}

export function pruneOldRecords(state: AppState, todayKey: string): AppState {
  const allowedDates = new Set(buildRecentDateKeys(todayKey));

  return {
    ...state,
    records: state.records.filter((record) => allowedDates.has(record.date)),
  };
}

export function getStudentHistory(
  state: AppState,
  studentNumber: number,
  todayKey: string,
): StudentHistoryEntry[] {
  const studentKey = String(studentNumber);

  return buildRecentDateKeys(todayKey).map((date) => ({
    date,
    weather: state.records.find((record) => record.date === date)?.entries[studentKey] ?? null,
  }));
}

export function getWeatherOption(weather: WeatherType) {
  return WEATHER_OPTIONS.find((option) => option.id === weather) ?? WEATHER_OPTIONS[0];
}

function dateKeyToUtcDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function utcDateToDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 4: Run domain tests**

Run:

```bash
npm test -- src/domain/weather.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit domain logic if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add src/domain/weather.ts src/domain/weather.test.ts && git commit -m "feat: add classroom weather domain logic" || echo "not a git repository; commit skipped"
```

---

### Task 3: localStorage Persistence

**Files:**
- Create: `src/domain/storage.ts`
- Modify: `src/domain/weather.test.ts`

- [ ] **Step 1: Add storage tests to `src/domain/weather.test.ts`**

Add this import to the top of the same test file:

```ts
import { loadAppState, saveAppState, STORAGE_KEY } from "./storage";
```

Then append this block below the existing `describe("weather domain", ...)` block:

```ts

describe("weather storage", () => {
  it("loads default state when localStorage is empty", () => {
    localStorage.clear();

    expect(loadAppState("2026-04-20")).toEqual(createDefaultState());
  });

  it("saves, loads, and prunes app state", () => {
    localStorage.clear();
    let state = createDefaultState();
    state = selectWeather(state, 1, "sunny", "2026-04-12");
    state = selectWeather(state, 1, "stormy", "2026-04-20");
    saveAppState(state);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").records).toHaveLength(2);
    expect(loadAppState("2026-04-20").records.map((record) => record.date)).toEqual([
      "2026-04-20",
    ]);
  });
});
```

- [ ] **Step 2: Run the failing storage tests**

Run:

```bash
npm test -- src/domain/weather.test.ts
```

Expected: FAIL because `src/domain/storage.ts` does not exist.

- [ ] **Step 3: Implement storage wrapper**

`src/domain/storage.ts`

```ts
import {
  AppState,
  createDefaultState,
  pruneOldRecords,
  updateStudentCount,
} from "./weather";

export const STORAGE_KEY = "classroom-emotion-tracker-state";

export function loadAppState(todayKey: string): AppState {
  const rawState = localStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(rawState) as Partial<AppState>;
    const defaultState = createDefaultState();
    const state: AppState = {
      settings: {
        studentCount: parsed.settings?.studentCount ?? defaultState.settings.studentCount,
        teacherPin: parsed.settings?.teacherPin ?? defaultState.settings.teacherPin,
      },
      records: Array.isArray(parsed.records) ? parsed.records : defaultState.records,
    };

    return pruneOldRecords(updateStudentCount(state, state.settings.studentCount), todayKey);
  } catch {
    return createDefaultState();
  }
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- [ ] **Step 4: Run storage tests**

Run:

```bash
npm test -- src/domain/weather.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit storage if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add src/domain/storage.ts src/domain/weather.test.ts && git commit -m "feat: persist classroom weather locally" || echo "not a git repository; commit skipped"
```

---

### Task 4: App Flow Tests Before UI

**Files:**
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing app tests**

`src/App.test.tsx`

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("Classroom emotion tracker app", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lets a student select weather and updates class stats without showing individual weather", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));

    expect(screen.getByText(/맑음/)).toBeInTheDocument();
    expect(screen.getByText("1명")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번 선택 완료" })).toBeInTheDocument();
    expect(screen.queryByText("1번 ☀️")).not.toBeInTheDocument();
  });

  it("requires first-time PIN setup before teacher details are visible", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    expect(screen.getByText("선생님 모드")).toBeInTheDocument();
    expect(screen.getByText("학생별 7일 흐름")).toBeInTheDocument();
  });

  it("shows individual weather after PIN unlock", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "2번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "🌧️ 속상해요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "1357");
    await user.type(screen.getByLabelText("새 PIN 확인"), "1357");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    expect(screen.getByRole("button", { name: "2번 🌧️ 비" })).toBeInTheDocument();
  });

  it("updates class size from settings", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));
    fireEvent.change(screen.getByLabelText("학급 인원"), { target: { value: "12" } });

    const grid = screen.getByLabelText("학생 번호 격자");
    expect(within(grid).getByRole("button", { name: "12번 마음 날씨 선택" })).toBeInTheDocument();
    expect(within(grid).queryByRole("button", { name: "13번 마음 날씨 선택" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing app tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 3: Commit failing app tests if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add src/App.test.tsx && git commit -m "test: describe classroom tracker user flows" || echo "not a git repository; commit skipped"
```

---

### Task 5: React UI Implementation

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create the React entry point**

`src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 2: Implement `src/App.tsx`**

```tsx
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

export default function App() {
  const todayKey = useMemo(() => getKoreanDateKey(), []);
  const [state, setState] = useState<AppState>(() => loadAppState(todayKey));
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [teacherMode, setTeacherMode] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(1);
  const stats = calculateStats(state, todayKey);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  function handleWeatherSelect(weather: WeatherType) {
    if (selectedStudent === null) {
      return;
    }

    setState((current) => selectWeather(current, selectedStudent, weather, todayKey));
    setSelectedStudent(null);
  }

  function handleTeacherUnlock(pin: string) {
    if (verifyPin(state, pin)) {
      setTeacherMode(true);
      setPinModalOpen(false);
      setHistoryStudent(1);
      return true;
    }

    return false;
  }

  function handleTeacherPinSet(pin: string) {
    if (!validatePin(pin)) {
      return false;
    }

    setState((current) => setTeacherPin(current, pin));
    setTeacherMode(true);
    setPinModalOpen(false);
    setHistoryStudent(1);
    return true;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">도덕 · 창의적 체험활동</p>
          <h1>우리 반 마음 날씨 예보관</h1>
          <p className="date-label">{todayKey}</p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setPinModalOpen(true)}
            aria-label="선생님 모드 열기"
          >
            선생님 모드
          </button>
          {teacherMode ? (
            <button
              className="icon-button"
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-label="설정 열기"
            >
              ⚙️
            </button>
          ) : null}
        </div>
      </header>

      <section className="dashboard" aria-label="오늘 마음 날씨 대시보드">
        <StatsPanel stats={stats} />
        <StudentGrid
          state={state}
          todayKey={todayKey}
          teacherMode={teacherMode}
          onSelectStudent={setSelectedStudent}
          onSelectHistoryStudent={setHistoryStudent}
        />
      </section>

      {teacherMode ? (
        <TeacherPanel state={state} todayKey={todayKey} selectedStudent={historyStudent} />
      ) : null}

      {settingsOpen ? (
        <SettingsPanel
          state={state}
          todayKey={todayKey}
          onChangeState={setState}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

      {selectedStudent !== null ? (
        <WeatherPickerModal
          studentNumber={selectedStudent}
          onSelect={handleWeatherSelect}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}

      {pinModalOpen ? (
        <TeacherPinModal
          hasPin={state.settings.teacherPin !== null}
          onUnlock={handleTeacherUnlock}
          onSetPin={handleTeacherPinSet}
          onClose={() => setPinModalOpen(false)}
        />
      ) : null}
    </main>
  );
}

function StatsPanel({ stats }: { stats: ReturnType<typeof calculateStats> }) {
  const completedRatio = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  const chartStyle = {
    background: `conic-gradient(
      #facc15 0 ${percentage(stats.sunny, stats.total)}%,
      #93c5fd ${percentage(stats.sunny, stats.total)}% ${percentage(stats.sunny + stats.cloudy, stats.total)}%,
      #60a5fa ${percentage(stats.sunny + stats.cloudy, stats.total)}% ${percentage(stats.sunny + stats.cloudy + stats.rainy, stats.total)}%,
      #f87171 ${percentage(stats.sunny + stats.cloudy + stats.rainy, stats.total)}% ${percentage(stats.completed, stats.total)}%,
      #e5e7eb ${percentage(stats.completed, stats.total)}% 100%
    )`,
  };

  return (
    <article className="stats-panel" aria-live="polite">
      <div>
        <p className="eyebrow">오늘 우리 반 마음 날씨</p>
        <h2>전체 분위기</h2>
      </div>
      <div className="chart-wrap">
        <div className="weather-chart" style={chartStyle} aria-hidden="true">
          <div className="chart-center">
            <strong>{completedRatio}%</strong>
            <span>참여</span>
          </div>
        </div>
      </div>
      <dl className="stats-list">
        {WEATHER_OPTIONS.map((option) => (
          <div className="stat-item" key={option.id}>
            <dt>
              <span aria-hidden="true">{option.emoji}</span>
              {option.shortLabel}
            </dt>
            <dd>{stats[option.id]}명</dd>
          </div>
        ))}
        <div className="stat-item muted">
          <dt>미선택</dt>
          <dd>{stats.missing}명</dd>
        </div>
      </dl>
    </article>
  );
}

function StudentGrid({
  state,
  todayKey,
  teacherMode,
  onSelectStudent,
  onSelectHistoryStudent,
}: {
  state: AppState;
  todayKey: string;
  teacherMode: boolean;
  onSelectStudent: (student: number) => void;
  onSelectHistoryStudent: (student: number) => void;
}) {
  const record = state.records.find((item) => item.date === todayKey);
  const students = Array.from({ length: state.settings.studentCount }, (_, index) => index + 1);

  return (
    <section className="student-board">
      <div className="section-heading">
        <div>
          <p className="eyebrow">학생 번호</p>
          <h2>마음 날씨 입력</h2>
        </div>
        <span className="privacy-badge">{teacherMode ? "선생님 모드" : "개별 날씨 숨김"}</span>
      </div>
      <div className="student-grid" aria-label="학생 번호 격자">
        {students.map((studentNumber) => {
          const weather = record?.entries[String(studentNumber)];
          const option = weather ? getWeatherOption(weather) : null;
          const buttonLabel =
            teacherMode && option
              ? `${studentNumber}번 ${option.emoji} ${option.shortLabel}`
              : weather
                ? `${studentNumber}번 선택 완료`
                : `${studentNumber}번 마음 날씨 선택`;

          return (
            <button
              className={`student-card ${weather ? "is-complete" : ""}`}
              key={studentNumber}
              type="button"
              aria-label={buttonLabel}
              onClick={() => {
                onSelectStudent(studentNumber);
                onSelectHistoryStudent(studentNumber);
              }}
            >
              <span className="student-number">{studentNumber}</span>
              {teacherMode && option ? (
                <span className="student-weather" aria-hidden="true">
                  {option.emoji}
                </span>
              ) : (
                <span className="student-state">{weather ? "선택 완료" : "미선택"}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeatherPickerModal({
  studentNumber,
  onSelect,
  onClose,
}: {
  studentNumber: number;
  onSelect: (weather: WeatherType) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="weather-title">
        <div className="modal-heading">
          <h2 id="weather-title">{studentNumber}번 오늘 마음 날씨</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="날씨 선택 닫기">
            ×
          </button>
        </div>
        <div className="weather-options">
          {WEATHER_OPTIONS.map((option) => (
            <button
              className={`weather-option ${option.id}`}
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-label={`${option.emoji} ${option.label} 선택`}
            >
              <span aria-hidden="true">{option.emoji}</span>
              <strong>{option.label}</strong>
              <small>{option.shortLabel}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeacherPinModal({
  hasPin,
  onUnlock,
  onSetPin,
  onClose,
}: {
  hasPin: boolean;
  onUnlock: (pin: string) => boolean;
  onSetPin: (pin: string) => boolean;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (hasPin) {
      const unlocked = onUnlock(pin);
      setError(unlocked ? "" : "PIN을 다시 확인해 주세요.");
      return;
    }

    if (!validatePin(pin)) {
      setError("PIN은 숫자 4자리로 입력해 주세요.");
      return;
    }

    if (pin !== pinConfirm) {
      setError("새 PIN과 확인 PIN이 같아야 합니다.");
      return;
    }

    const saved = onSetPin(pin);
    setError(saved ? "" : "PIN을 저장하지 못했습니다. 숫자 4자리인지 확인해 주세요.");
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal narrow" role="dialog" aria-modal="true" aria-labelledby="pin-title">
        <div className="modal-heading">
          <h2 id="pin-title">{hasPin ? "선생님 PIN 입력" : "선생님 PIN 설정"}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="PIN 창 닫기">
            ×
          </button>
        </div>
        <form className="pin-form" onSubmit={handleSubmit}>
          <label htmlFor="teacher-pin">{hasPin ? "PIN" : "새 PIN"}</label>
          <input
            id="teacher-pin"
            name="teacher-pin"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          {!hasPin ? (
            <>
              <label htmlFor="teacher-pin-confirm">새 PIN 확인</label>
              <input
                id="teacher-pin-confirm"
                name="teacher-pin-confirm"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                value={pinConfirm}
                onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="primary-button" type="submit">
            {hasPin ? "선생님 모드 열기" : "PIN 설정"}
          </button>
        </form>
      </section>
    </div>
  );
}

function TeacherPanel({
  state,
  todayKey,
  selectedStudent,
}: {
  state: AppState;
  todayKey: string;
  selectedStudent: number;
}) {
  const history = getStudentHistory(state, selectedStudent, todayKey);

  return (
    <section className="teacher-panel" aria-label="선생님 모드">
      <div className="section-heading">
        <div>
          <p className="eyebrow">선생님 모드</p>
          <h2>학생별 7일 흐름</h2>
        </div>
        <strong>{selectedStudent}번</strong>
      </div>
      <ol className="history-list">
        {history.map((entry) => {
          const option = entry.weather ? getWeatherOption(entry.weather) : null;
          return (
            <li key={entry.date}>
              <span>{entry.date.slice(5)}</span>
              <strong>{option ? `${option.emoji} ${option.shortLabel}` : "기록 없음"}</strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SettingsPanel({
  state,
  todayKey,
  onChangeState,
  onClose,
}: {
  state: AppState;
  todayKey: string;
  onChangeState: (updater: (state: AppState) => AppState) => void;
  onClose: () => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  function handlePinChange(event: FormEvent) {
    event.preventDefault();

    if (!verifyPin(state, currentPin)) {
      setPinMessage("현재 PIN을 다시 확인해 주세요.");
      return;
    }

    if (!validatePin(newPin)) {
      setPinMessage("새 PIN은 숫자 4자리로 입력해 주세요.");
      return;
    }

    onChangeState((current) => setTeacherPin(current, newPin));
    setCurrentPin("");
    setNewPin("");
    setPinMessage("PIN이 변경되었습니다.");
  }

  return (
    <section className="settings-panel" aria-label="설정">
      <div className="section-heading">
        <div>
          <p className="eyebrow">설정</p>
          <h2>학급 운영 설정</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="설정 닫기">
          ×
        </button>
      </div>

      <label htmlFor="student-count">학급 인원</label>
      <input
        id="student-count"
        name="student-count"
        type="number"
        min={1}
        max={40}
        inputMode="numeric"
        value={state.settings.studentCount}
        onChange={(event) => {
          onChangeState((current) => updateStudentCount(current, Number(event.target.value)));
        }}
      />

      <form className="pin-form inline" onSubmit={handlePinChange}>
        <label htmlFor="current-pin">현재 PIN</label>
        <input
          id="current-pin"
          name="current-pin"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={currentPin}
          onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <label htmlFor="new-pin">새 PIN</label>
        <input
          id="new-pin"
          name="new-pin"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={newPin}
          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        {pinMessage ? (
          <p className="form-note" aria-live="polite">
            {pinMessage}
          </p>
        ) : null}
        <button className="secondary-button" type="submit">
          PIN 변경
        </button>
      </form>

      <button
        className="danger-button"
        type="button"
        onClick={() => {
          if (window.confirm("오늘 기록을 초기화할까요?")) {
            onChangeState((current) => resetTodayRecord(current, todayKey));
          }
        }}
      >
        오늘 기록 초기화
      </button>
    </section>
  );
}

function percentage(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
```

- [ ] **Step 3: Implement `src/styles.css`**

```css
:root {
  color: #172033;
  background: #f8fbff;
  font-family:
    Inter, Pretendard, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(96, 165, 250, 0.22);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 251, 255, 0.96)),
    #f8fbff;
}

button,
input {
  font: inherit;
  touch-action: manipulation;
}

button {
  cursor: pointer;
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}

.app-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
}

.app-header,
.dashboard,
.section-heading,
.header-actions,
.modal-heading {
  display: flex;
  align-items: center;
}

.app-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: clamp(2rem, 5vw, 4.8rem);
  line-height: 1.02;
  text-wrap: balance;
}

h2 {
  font-size: 1.45rem;
  text-wrap: balance;
}

.eyebrow {
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
  margin-bottom: 6px;
}

.date-label {
  color: #64748b;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

.header-actions {
  gap: 10px;
}

.primary-button,
.secondary-button,
.danger-button,
.icon-button {
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.primary-button:hover,
.secondary-button:hover,
.danger-button:hover,
.icon-button:hover {
  transform: translateY(-1px);
}

.primary-button {
  color: white;
  background: #2563eb;
  padding: 12px 18px;
}

.secondary-button {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 12px 18px;
}

.danger-button {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fecaca;
  padding: 12px 18px;
}

.icon-button {
  width: 44px;
  height: 44px;
  color: #172033;
  background: #ffffff;
  border: 1px solid #dbeafe;
  display: grid;
  place-items: center;
}

.dashboard {
  align-items: stretch;
  gap: 18px;
}

.stats-panel,
.student-board,
.teacher-panel,
.settings-panel,
.modal {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(37, 99, 235, 0.08);
}

.stats-panel {
  flex: 0 0 340px;
  padding: 22px;
  display: grid;
  gap: 20px;
}

.chart-wrap {
  display: grid;
  place-items: center;
}

.weather-chart {
  width: min(230px, 70vw);
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.chart-center {
  width: 48%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ffffff;
  display: grid;
  place-items: center;
  align-content: center;
  box-shadow: inset 0 0 0 1px #dbeafe;
}

.chart-center strong,
.stat-item dd {
  font-variant-numeric: tabular-nums;
}

.chart-center strong {
  font-size: 1.8rem;
}

.chart-center span {
  color: #64748b;
  font-size: 0.9rem;
}

.stats-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
}

.stat-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
}

.stat-item dt,
.stat-item dd {
  margin: 0;
}

.stat-item dt {
  color: #475569;
  font-weight: 700;
}

.stat-item dd {
  font-size: 1.4rem;
  font-weight: 900;
}

.muted {
  color: #64748b;
}

.student-board {
  flex: 1;
  padding: 22px;
  min-width: 0;
}

.section-heading {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.privacy-badge {
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 999px;
  padding: 7px 10px;
  font-weight: 800;
  white-space: nowrap;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 10px;
}

.student-card {
  min-height: 82px;
  color: #172033;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 10px;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease;
}

.student-card:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
}

.student-card.is-complete {
  background: #fef9c3;
  border-color: #fde68a;
}

.student-number {
  font-size: 1.55rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.student-state,
.student-weather {
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 800;
}

.student-weather {
  font-size: 1.55rem;
}

.teacher-panel,
.settings-panel {
  margin-top: 18px;
  padding: 22px;
}

.history-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
}

.history-list li {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
  min-width: 0;
}

.history-list span,
.history-list strong {
  display: block;
}

.history-list span {
  color: #64748b;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}

.history-list strong {
  margin-top: 6px;
  word-break: keep-all;
}

.settings-panel {
  display: grid;
  gap: 12px;
}

.settings-panel label,
.pin-form label {
  color: #334155;
  font-weight: 800;
}

.settings-panel input,
.pin-form input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-variant-numeric: tabular-nums;
}

.pin-form {
  display: grid;
  gap: 10px;
}

.pin-form.inline {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.form-error {
  color: #991b1b;
  background: #fee2e2;
  border-radius: 8px;
  padding: 10px;
}

.form-note {
  color: #166534;
  background: #dcfce7;
  border-radius: 8px;
  padding: 10px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.42);
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal {
  width: min(760px, 100%);
  padding: 22px;
}

.modal.narrow {
  width: min(420px, 100%);
}

.modal-heading {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.weather-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.weather-option {
  min-height: 150px;
  border: 2px solid transparent;
  border-radius: 8px;
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 14px;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease;
}

.weather-option:hover {
  transform: translateY(-2px);
  border-color: #2563eb;
}

.weather-option span {
  font-size: 3rem;
}

.weather-option strong {
  font-size: 1.05rem;
  word-break: keep-all;
}

.weather-option small {
  color: #64748b;
  font-weight: 800;
}

.weather-option.sunny {
  background: #fef9c3;
}

.weather-option.cloudy {
  background: #e0f2fe;
}

.weather-option.rainy {
  background: #dbeafe;
}

.weather-option.stormy {
  background: #fee2e2;
}

@media (max-width: 820px) {
  .app-header,
  .dashboard {
    flex-direction: column;
  }

  .app-header {
    align-items: flex-start;
  }

  .stats-panel {
    flex: auto;
    width: 100%;
  }

  .weather-options {
    grid-template-columns: 1fr 1fr;
  }

  .history-list {
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 4: Run app tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run all unit and component tests**

Run:

```bash
npm test
```

Expected: PASS for `src/domain/weather.test.ts` and `src/App.test.tsx`.

- [ ] **Step 6: Commit React UI if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add src/main.tsx src/App.tsx src/styles.css && git commit -m "feat: build classroom emotion tracker UI" || echo "not a git repository; commit skipped"
```

---

### Task 6: Browser Smoke Test

**Files:**
- Create: `tests/classroom-emotion-tracker.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write Playwright smoke test**

`tests/classroom-emotion-tracker.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("student check-in and teacher mode work", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "1번 마음 날씨 선택" }).click();
  await page.getByRole("button", { name: "☀️ 좋아요 선택" }).click();

  await expect(page.getByRole("button", { name: "1번 선택 완료" })).toBeVisible();
  await expect(page.getByText("1명").first()).toBeVisible();

  await page.getByRole("button", { name: "선생님 모드 열기" }).click();
  await page.getByLabel("새 PIN").fill("2468");
  await page.getByLabel("새 PIN 확인").fill("2468");
  await page.getByRole("button", { name: "PIN 설정" }).click();

  await expect(page.getByText("선생님 모드")).toBeVisible();
  await expect(page.getByRole("button", { name: "1번 ☀️ 맑음" })).toBeVisible();
});
```

- [ ] **Step 2: Create Playwright config**

`playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 3: Run the smoke test**

Run:

```bash
npm run e2e
```

Expected: PASS in Chromium.

- [ ] **Step 4: Commit smoke test if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add playwright.config.ts tests/classroom-emotion-tracker.spec.ts && git commit -m "test: cover classroom tracker browser flow" || echo "not a git repository; commit skipped"
```

---

### Task 7: Build, Guidelines Check, and Manual Verification

**Files:**
- Review: `src/App.tsx`
- Review: `src/styles.css`
- Review: `index.html`

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` is generated.

- [ ] **Step 2: Fetch current Web Interface Guidelines**

Run:

```bash
curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md -o /tmp/web-interface-guidelines.md
```

Expected: `/tmp/web-interface-guidelines.md` exists.

- [ ] **Step 3: Run quick anti-pattern checks**

Run:

```bash
rg -n "outline-none|outline:\\s*none|transition:\\s*all|onPaste|<div[^>]*onClick|<span[^>]*onClick|user-scalable=no|maximum-scale=1" src index.html
```

Expected: no matches.

- [ ] **Step 4: Manually inspect against fetched guidelines**

Check these concrete items:

- All interactive controls in `src/App.tsx` are `<button>` or form controls.
- Icon-only buttons have `aria-label`.
- Inputs have labels and meaningful names.
- Focus states are visible in `src/styles.css`.
- Motion uses explicit properties and respects `prefers-reduced-motion`.
- The viewport meta tag does not disable zoom.
- Dynamic stat updates are inside an `aria-live="polite"` region.

Expected: no issues. If an issue is found, fix it before continuing.

- [ ] **Step 5: Start local dev server for user verification**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 6: Verify the core classroom flow in the browser**

Use the local URL from Step 5 and check:

- Student 1 can choose `☀️ 좋아요`.
- Student 2 can choose `🌧️ 속상해요`.
- General grid shows selected status but not individual weather emojis.
- Teacher mode first asks to set a 4-digit PIN.
- Teacher mode shows individual weather after PIN setup.
- Settings can change class size from 20 to 12.
- Today's record reset asks for confirmation.

Expected: every item works.

- [ ] **Step 7: Commit final verification fixes if git exists**

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git add . && git commit -m "chore: verify classroom tracker release" || echo "not a git repository; commit skipped"
```

---

## Final Report Template

After implementation, report:

- Files created or modified.
- Test commands run and their pass/fail result.
- Browser URL for local review.
- Any known limitations, especially that data is browser-local and not synced across devices.
