export type WeatherType = "sunny" | "cloudy" | "rainy" | "stormy";

export type WeatherOption = {
  value: WeatherType;
  emoji: string;
  label: string;
};

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

export type WeatherStats = {
  sunny: number;
  cloudy: number;
  rainy: number;
  stormy: number;
  missing: number;
  total: number;
  completed: number;
};

export type StudentHistoryEntry = {
  date: string;
  weather: WeatherType | null;
};

export const WEATHER_OPTIONS: WeatherOption[] = [
  { value: "sunny", emoji: "☀️", label: "맑음" },
  { value: "cloudy", emoji: "⛅", label: "구름" },
  { value: "rainy", emoji: "🌧️", label: "비" },
  { value: "stormy", emoji: "⚡", label: "번개" },
];

const DEFAULT_STUDENT_COUNT = 20;
const MIN_STUDENT_COUNT = 1;
const MAX_STUDENT_COUNT = 40;
const DAYS_TO_KEEP = 7;

function cloneState(state: AppState): AppState {
  return {
    settings: { ...state.settings },
    records: state.records.map((record) => ({
      date: record.date,
      entries: { ...record.entries },
    })),
  };
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getKoreanDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createDefaultState(): AppState {
  return {
    settings: {
      studentCount: DEFAULT_STUDENT_COUNT,
      teacherPin: null,
    },
    records: [],
  };
}

export function updateStudentCount(state: AppState, studentCount: number): AppState {
  const safeStudentCount = Number.isFinite(studentCount) ? Math.round(studentCount) : state.settings.studentCount;
  const nextStudentCount = Math.min(MAX_STUDENT_COUNT, Math.max(MIN_STUDENT_COUNT, safeStudentCount));

  return {
    ...cloneState(state),
    settings: {
      ...state.settings,
      studentCount: nextStudentCount,
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
    ...cloneState(state),
    settings: {
      ...state.settings,
      teacherPin: pin,
    },
  };
}

export function verifyPin(state: AppState, pin: string): boolean {
  return state.settings.teacherPin !== null && state.settings.teacherPin === pin;
}

export function getWeatherOption(weather: WeatherType): WeatherOption {
  return WEATHER_OPTIONS.find((option) => option.value === weather) ?? WEATHER_OPTIONS[0];
}

function sortRecords(records: DailyWeatherRecord[]): DailyWeatherRecord[] {
  return [...records].sort((left, right) => left.date.localeCompare(right.date));
}

export function selectWeather(
  state: AppState,
  studentNumber: number,
  weather: WeatherType,
  dateKey: string,
): AppState {
  const nextState = cloneState(state);
  const recordIndex = nextState.records.findIndex((record) => record.date === dateKey);
  const nextRecord: DailyWeatherRecord = {
    date: dateKey,
    entries: {
      ...(recordIndex >= 0 ? nextState.records[recordIndex].entries : {}),
      [String(studentNumber)]: weather,
    },
  };

  if (recordIndex >= 0) {
    nextState.records[recordIndex] = nextRecord;
  } else {
    nextState.records.push(nextRecord);
  }

  nextState.records = sortRecords(nextState.records);
  return nextState;
}

export function resetTodayRecord(state: AppState, dateKey: string): AppState {
  return {
    ...cloneState(state),
    records: state.records.filter((record) => record.date !== dateKey),
  };
}

export function buildRecentDateKeys(todayKey: string): string[] {
  const today = fromDateKey(todayKey);

  return Array.from({ length: DAYS_TO_KEEP }, (_, index) => {
    const offset = DAYS_TO_KEEP - 1 - index;
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    return toDateKey(date);
  });
}

export function pruneOldRecords(state: AppState, todayKey: string): AppState {
  const allowedKeys = new Set(buildRecentDateKeys(todayKey));

  return {
    ...cloneState(state),
    records: sortRecords(state.records.filter((record) => allowedKeys.has(record.date))),
  };
}

export function calculateStats(state: AppState, todayKey: string): WeatherStats {
  const record = state.records.find((entry) => entry.date === todayKey);
  const total = state.settings.studentCount;
  let completed = 0;
  const weatherCounts: Record<WeatherType, number> = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    stormy: 0,
  };
  const stats: WeatherStats = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    stormy: 0,
    missing: 0,
    total,
    completed: 0,
  };

  for (let studentNumber = 1; studentNumber <= total; studentNumber += 1) {
    const weather = record?.entries[String(studentNumber)];
    if (weather) {
      weatherCounts[weather] += 1;
      completed += 1;
    } else {
      stats.missing += 1;
    }
  }

  stats.sunny = weatherCounts.sunny;
  stats.cloudy = weatherCounts.cloudy;
  stats.rainy = weatherCounts.rainy;
  stats.stormy = weatherCounts.stormy;
  stats.completed = completed;
  return stats;
}

export function getStudentHistory(
  state: AppState,
  studentNumber: number,
  todayKey: string,
): StudentHistoryEntry[] {
  const dateKeys = buildRecentDateKeys(todayKey);

  return dateKeys.map((date) => {
    const record = state.records.find((entry) => entry.date === date);
    return {
      date,
      weather: record?.entries[String(studentNumber)] ?? null,
    };
  });
}
