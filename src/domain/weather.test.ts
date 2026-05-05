import { describe, expect, it } from "vitest";
import {
  AppState,
  DailyWeatherRecord,
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
  WEATHER_OPTIONS,
} from "./weather";
import { loadAppState, saveAppState, STORAGE_KEY } from "./storage";

describe("weather domain", () => {
  it("creates the default classroom state", () => {
    const state = createDefaultState();

    expect(state.settings.studentCount).toBe(20);
    expect(state.settings.teacherPin).toBeNull();
    expect(state.records).toEqual([]);
  });

  it("uses the approved classroom weather labels and emoji", () => {
    expect(WEATHER_OPTIONS).toEqual([
      { value: "sunny", emoji: "☀️", label: "맑음" },
      { value: "cloudy", emoji: "⛅", label: "구름" },
      { value: "rainy", emoji: "🌧️", label: "비" },
      { value: "stormy", emoji: "⚡", label: "번개" },
    ]);
  });

  it("validates student count boundaries", () => {
    let state = createDefaultState();

    state = updateStudentCount(state, 0);
    expect(state.settings.studentCount).toBe(1);

    state = updateStudentCount(state, 41);
    expect(state.settings.studentCount).toBe(40);

    state = updateStudentCount(state, 24);
    expect(state.settings.studentCount).toBe(24);

    state = updateStudentCount(state, Number.NaN);
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

  it("clears only today's record and keeps previous in-window history", () => {
    let state: AppState = {
      ...createDefaultState(),
      records: [
        { date: "2026-04-20", entries: { "1": "sunny" } },
        { date: "2026-04-19", entries: { "2": "stormy" } },
        { date: "2026-04-14", entries: { "3": "rainy" } },
      ],
    };

    state = resetTodayRecord(state, "2026-04-20");

    expect(state.records).toHaveLength(2);
    expect(state.records).toEqual(
      expect.arrayContaining([
        { date: "2026-04-19", entries: { "2": "stormy" } },
        { date: "2026-04-14", entries: { "3": "rainy" } },
      ]),
    );
    expect(state.records.every((record: DailyWeatherRecord) => record.date !== "2026-04-20")).toBe(true);
    expect(calculateStats(state, "2026-04-19").completed).toBe(1);
    expect(calculateStats(state, "2026-04-20").completed).toBe(0);
  });
});

describe("weather storage", () => {
  it("loads default state when localStorage is empty", () => {
    localStorage.clear();

    expect(loadAppState("2026-04-20")).toEqual(createDefaultState());
  });

  it("recovers from invalid JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "not json");

    expect(loadAppState("2026-04-20")).toEqual(createDefaultState());
  });

  it("coerces malformed parsed settings while preserving valid fields", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { studentCount: "abc", teacherPin: "2468" },
        records: [],
      }),
    );

    expect(loadAppState("2026-04-20")).toEqual({
      settings: {
        studentCount: 20,
        teacherPin: "2468",
      },
      records: [],
    });
  });

  it("sanitizes malformed stored records and invalid weather values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { studentCount: 3, teacherPin: "999" },
        records: [
          { date: "2026-04-19", entries: { "1": "sunny", "2": "hail", "3": null } },
          { date: "2026-04-20", entries: null },
          { date: 20260420, entries: { "1": "rainy" } },
        ],
      }),
    );

    const state = loadAppState("2026-04-20");

    expect(state).toEqual({
      settings: {
        studentCount: 3,
        teacherPin: null,
      },
      records: [
        { date: "2026-04-19", entries: { "1": "sunny" } },
        { date: "2026-04-20", entries: {} },
      ],
    });
    expect(calculateStats(state, "2026-04-19")).toMatchObject({
      sunny: 1,
      completed: 1,
      missing: 2,
    });
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
