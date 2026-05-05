import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Classroom emotion tracker app", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets a student select weather and updates class stats without showing individual weather", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));

    expect(screen.getByText(/맑음/)).toBeInTheDocument();
    expect(screen.getByText("1명")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번 선택 완료" })).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "오늘 감정 분포, 참여 1 / 20명, 맑음 1명, 구름 0명, 비 0명, 번개 0명, 아직 선택 전 19명",
      ),
    ).toHaveTextContent("현재 참여");
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
    expect(screen.getByText("선택한 학생 흐름")).toBeInTheDocument();
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

  it("shows guidance before a teacher selects a student", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    expect(screen.getByText("학생 번호를 눌러 살펴볼 친구를 선택해주세요.")).toBeInTheDocument();
  });

  it("focuses teacher detail on the selected student instead of opening the picker", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "2번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "🌧️ 속상해요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    await user.click(screen.getByRole("button", { name: "2번 🌧️ 비" }));

    expect(screen.getByText("선택한 학생")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2번" })).toBeInTheDocument();
    expect(screen.getByLabelText("2번 7일 흐름")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "오늘 마음 날씨 고르기" })).not.toBeInTheDocument();
  });

  it("restores saved records and requires PIN unlock after remount", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    firstRender.unmount();

    const nextUser = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: "1번 선택 완료" })).toBeInTheDocument();
    expect(screen.getByText("1명")).toBeInTheDocument();

    await nextUser.click(screen.getByRole("button", { name: "선생님 모드 열기" }));

    expect(screen.getByRole("dialog", { name: "PIN 입력" })).toBeInTheDocument();
    expect(screen.queryByLabelText("새 PIN")).not.toBeInTheDocument();

    await nextUser.type(screen.getByLabelText("PIN"), "2468");
    await nextUser.click(screen.getByRole("button", { name: "잠금 해제" }));

    expect(screen.getByText("선생님 모드")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번 ☀️ 맑음" })).toBeInTheDocument();
  });

  it("shows a teacher re-lock action and clears private teacher context immediately", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    await user.click(screen.getByRole("button", { name: "설정 열기" }));
    await user.click(screen.getByRole("button", { name: "1번 ☀️ 맑음" }));

    expect(screen.getByRole("heading", { name: "1번" })).toBeInTheDocument();
    expect(screen.getByText("선택한 학생")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "교사용 잠그기" }));

    expect(screen.queryByRole("heading", { name: "1번" })).not.toBeInTheDocument();
    expect(screen.queryByText("선택한 학생 흐름")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "설정 닫기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "교사용 잠그기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "선생님 모드" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번 선택 완료" })).toBeInTheDocument();
  });

  it("requires PIN again after re-lock while keeping saved PIN and weather data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));

    await user.click(screen.getByRole("button", { name: "교사용 잠그기" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));

    expect(screen.getByRole("dialog", { name: "PIN 입력" })).toBeInTheDocument();
    expect(screen.queryByLabelText("새 PIN")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("PIN"), "1111");
    await user.click(screen.getByRole("button", { name: "잠금 해제" }));
    expect(screen.getByRole("alert")).toHaveTextContent("PIN이 맞지 않아요.");

    await user.clear(screen.getByLabelText("PIN"));
    await user.type(screen.getByLabelText("PIN"), "2468");
    await user.click(screen.getByRole("button", { name: "잠금 해제" }));

    expect(screen.getByRole("button", { name: "1번 ☀️ 맑음" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("classroom-emotion-tracker-state") ?? "{}")).toMatchObject({
      settings: { teacherPin: "2468" },
    });
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
    expect(within(grid).getByRole("button", { name: "12번" })).toBeInTheDocument();
    expect(within(grid).queryByRole("button", { name: "13번" })).not.toBeInTheDocument();
  });

  it("keeps today's record when reset confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));
    await user.click(screen.getByRole("button", { name: "오늘 기록 초기화" }));

    expect(confirmSpy).toHaveBeenCalledWith("오늘 기록을 모두 초기화할까요?");
    expect(screen.getByLabelText(/오늘 감정 분포, 참여 1 \/ 20명/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번 ☀️ 맑음" })).toBeInTheDocument();
  });

  it("clears today's record when reset confirmation is accepted", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1번 마음 날씨 선택" }));
    await user.click(screen.getByRole("button", { name: "☀️ 좋아요 선택" }));
    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));
    await user.click(screen.getByRole("button", { name: "오늘 기록 초기화" }));

    expect(confirmSpy).toHaveBeenCalledWith("오늘 기록을 모두 초기화할까요?");
    expect(screen.getByLabelText(/오늘 감정 분포, 참여 0 \/ 20명/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1번 ☀️ 맑음" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1번" })).toBeInTheDocument();
  });

  it("clears the selected teacher student when class size shrinks past that number", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "12번" }));

    expect(screen.getByRole("heading", { name: "12번" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "설정 열기" }));
    fireEvent.change(screen.getByLabelText("학급 인원"), { target: { value: "10" } });

    expect(screen.queryByRole("heading", { name: "12번" })).not.toBeInTheDocument();
    expect(screen.getByText("학생 번호를 눌러 살펴볼 친구를 선택해주세요.")).toBeInTheDocument();
  });

  it("shows an error when the current PIN is wrong during PIN change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));

    await user.type(screen.getByLabelText("현재 PIN"), "1111");
    await user.type(screen.getByLabelText("새 PIN", { selector: "#next-pin" }), "1357");
    await user.type(screen.getByLabelText("새 PIN 확인", { selector: "#next-pin-confirmation" }), "1357");
    await user.click(screen.getByRole("button", { name: "PIN 변경" }));

    expect(screen.getByRole("alert")).toHaveTextContent("현재 PIN이 맞지 않아요.");
  });

  it("shows an error when the current PIN format is invalid during PIN change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));

    await user.type(screen.getByLabelText("현재 PIN"), "11");
    await user.type(screen.getByLabelText("새 PIN", { selector: "#next-pin" }), "1357");
    await user.type(screen.getByLabelText("새 PIN 확인", { selector: "#next-pin-confirmation" }), "1357");
    await user.click(screen.getByRole("button", { name: "PIN 변경" }));

    expect(screen.getByRole("alert")).toHaveTextContent("현재 PIN은 숫자 4자리로 입력해주세요.");
  });

  it("shows an error when the new PIN format is invalid during PIN change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));

    await user.type(screen.getByLabelText("현재 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN", { selector: "#next-pin" }), "13");
    await user.type(screen.getByLabelText("새 PIN 확인", { selector: "#next-pin-confirmation" }), "13");
    await user.click(screen.getByRole("button", { name: "PIN 변경" }));

    expect(screen.getByRole("alert")).toHaveTextContent("새 PIN은 숫자 4자리로 입력해주세요.");
  });

  it("shows an error when the new PIN confirmation does not match during PIN change", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));

    await user.type(screen.getByLabelText("현재 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN", { selector: "#next-pin" }), "1357");
    await user.type(screen.getByLabelText("새 PIN 확인", { selector: "#next-pin-confirmation" }), "9999");
    await user.click(screen.getByRole("button", { name: "PIN 변경" }));

    expect(screen.getByRole("alert")).toHaveTextContent("새 PIN 확인이 서로 달라요.");
  });

  it("changes the teacher PIN successfully", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    await user.type(screen.getByLabelText("새 PIN"), "2468");
    await user.type(screen.getByLabelText("새 PIN 확인"), "2468");
    await user.click(screen.getByRole("button", { name: "PIN 설정" }));
    await user.click(screen.getByRole("button", { name: "설정 열기" }));

    const currentPinInput = screen.getByLabelText("현재 PIN");
    const newPinInput = screen.getByLabelText("새 PIN", { selector: "#next-pin" });
    const confirmationInput = screen.getByLabelText("새 PIN 확인", {
      selector: "#next-pin-confirmation",
    });

    await user.type(currentPinInput, "2468");
    await user.type(newPinInput, "1357");
    await user.type(confirmationInput, "1357");
    await user.click(screen.getByRole("button", { name: "PIN 변경" }));

    expect(screen.getByText("PIN을 변경했어요.")).toBeInTheDocument();
    expect(currentPinInput).toHaveValue("");
    expect(newPinInput).toHaveValue("");
    expect(confirmationInput).toHaveValue("");
    expect(JSON.parse(localStorage.getItem("classroom-emotion-tracker-state") ?? "{}")).toMatchObject({
      settings: { teacherPin: "1357" },
    });

    await user.click(screen.getByRole("button", { name: "선생님 모드 열기" }));
    const unlockPinInput = screen.getByLabelText("PIN");
    await user.type(unlockPinInput, "2468");
    await user.click(screen.getByRole("button", { name: "잠금 해제" }));
    expect(screen.getByRole("alert")).toHaveTextContent("PIN이 맞지 않아요.");

    await user.clear(unlockPinInput);
    await user.type(unlockPinInput, "1357");
    await user.click(screen.getByRole("button", { name: "잠금 해제" }));
    expect(screen.queryByRole("dialog", { name: "PIN 입력" })).not.toBeInTheDocument();
  });
});
