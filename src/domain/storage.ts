import {
  AppState,
  DailyWeatherRecord,
  WEATHER_OPTIONS,
  WeatherType,
  createDefaultState,
  pruneOldRecords,
  updateStudentCount,
  validatePin,
} from "./weather";

export const STORAGE_KEY = "classroom-emotion-tracker-state";
const WEATHER_VALUES = new Set<WeatherType>(WEATHER_OPTIONS.map((option) => option.value));
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function coerceStudentCount(value: unknown, fallback: number): number {
  const nextStudentCount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(nextStudentCount) ? nextStudentCount : fallback;
}

function sanitizeTeacherPin(value: unknown): string | null {
  return typeof value === "string" && validatePin(value) ? value : null;
}

function isWeatherType(value: unknown): value is WeatherType {
  return typeof value === "string" && WEATHER_VALUES.has(value as WeatherType);
}

function sanitizeEntries(value: unknown): Record<string, WeatherType> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, WeatherType>>((entries, [studentKey, weather]) => {
    if (isWeatherType(weather)) {
      entries[studentKey] = weather;
    }

    return entries;
  }, {});
}

function sanitizeRecords(value: unknown): DailyWeatherRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return [];
    }

    const candidate = record as { date?: unknown; entries?: unknown };
    if (typeof candidate.date !== "string" || !DATE_KEY_PATTERN.test(candidate.date)) {
      return [];
    }

    return [
      {
        date: candidate.date,
        entries: sanitizeEntries(candidate.entries),
      },
    ];
  });
}

export function loadAppState(todayKey: string): AppState {
  const rawState = localStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(rawState) as Partial<AppState>;
    const defaultState = createDefaultState();
    const studentCount = coerceStudentCount(
      parsed.settings?.studentCount,
      defaultState.settings.studentCount,
    );
    const state: AppState = {
      settings: {
        studentCount,
        teacherPin: sanitizeTeacherPin(parsed.settings?.teacherPin),
      },
      records: sanitizeRecords(parsed.records),
    };

    return pruneOldRecords(updateStudentCount(state, studentCount), todayKey);
  } catch {
    return createDefaultState();
  }
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
