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

    expect(screen.getByRole("status")).toHaveTextContent("PIN을 변경했어요.");
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
