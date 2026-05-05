import { expect, test, type Page } from "@playwright/test";

async function selectStudentWeather(page: Page, studentNumber: number, weatherLabel: RegExp) {
  const studentGrid = page.getByLabel("학생 번호 격자");
  await studentGrid.getByRole("button", { name: new RegExp(`^${studentNumber}번`) }).click();
  await page.getByRole("button", { name: weatherLabel }).click();
}

async function setTeacherPin(page: Page, pin: string) {
  await page.getByRole("button", { name: "선생님 모드 열기" }).click();
  await page.getByLabel("새 PIN", { exact: true }).fill(pin);
  await page.getByLabel("새 PIN 확인", { exact: true }).fill(pin);
  await page.getByRole("button", { name: "PIN 설정" }).click();
}

test("student check-in and teacher mode work", async ({ page }) => {
  await page.goto("/");

  const studentGrid = page.getByLabel("학생 번호 격자");
  const studentOne = studentGrid.getByRole("button", { name: /^1번/ });

  await studentOne.click();
  await page.getByRole("button", { name: /좋아요 선택/ }).click();

  await expect(studentOne).toBeVisible();
  await expect(studentOne).toHaveAccessibleName(/선택 완료/);
  await expect(page.getByText("1명").first()).toBeVisible();

  await setTeacherPin(page, "2468");

  await expect(page.getByText("선생님 모드")).toBeVisible();
  await expect(studentOne).toHaveAccessibleName(/맑음/);
});

test("teacher mode can be re-locked and unlocked again with the saved PIN", async ({ page }) => {
  await page.goto("/");

  await selectStudentWeather(page, 1, /좋아요 선택/);

  await setTeacherPin(page, "2468");
  await expect(page.getByRole("heading", { name: "선생님 모드" })).toBeVisible();
  await page.getByRole("button", { name: "1번 ☀️ 맑음" }).click();
  await expect(page.getByRole("heading", { name: "1번" })).toBeVisible();

  await page.getByRole("button", { name: "교사용 잠그기" }).click();
  await expect(page.getByRole("heading", { name: "선생님 모드" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "1번" })).not.toBeVisible();
  await expect(page.getByLabel("학생 번호 격자").getByRole("button", { name: "1번 선택 완료" })).toBeVisible();

  await page.getByRole("button", { name: "선생님 모드 열기" }).click();
  await expect(page.getByRole("dialog", { name: "PIN 입력" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PIN 설정" })).not.toBeVisible();
  await page.locator("#teacher-pin").fill("1111");
  await page.getByRole("button", { name: "잠금 해제" }).click();
  await expect(page.getByRole("alert")).toHaveText("PIN이 맞지 않아요.");

  await page.locator("#teacher-pin").fill("2468");
  await page.getByRole("button", { name: "잠금 해제" }).click();

  await expect(page.getByRole("heading", { name: "선생님 모드" })).toBeVisible();
  await expect(page.getByText("학생 번호를 눌러 살펴볼 친구를 선택해주세요.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1번" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "1번 ☀️ 맑음" })).toBeVisible();
});

test("saved state survives reload and requires the correct PIN to re-enter teacher mode", async ({
  page,
}) => {
  await page.goto("/");

  await selectStudentWeather(page, 2, /속상해요 선택/);
  await setTeacherPin(page, "2468");
  await page.reload();

  await expect(page.getByLabel("학생 번호 격자").getByRole("button", { name: "2번 선택 완료" })).toBeVisible();
  await expect(page.getByText("1명")).toBeVisible();

  await page.getByRole("button", { name: "선생님 모드 열기" }).click();
  await page.locator("#teacher-pin").fill("1111");
  await page.getByRole("button", { name: "잠금 해제" }).click();
  await expect(page.getByRole("alert")).toHaveText("PIN이 맞지 않아요.");

  await page.locator("#teacher-pin").fill("2468");
  await page.getByRole("button", { name: "잠금 해제" }).click();

  await expect(page.getByText("선생님 모드")).toBeVisible();
  await expect(page.getByLabel("학생 번호 격자").getByRole("button", { name: "2번 🌧️ 비" })).toBeVisible();
});

test("today reset only happens after confirmation", async ({ page }) => {
  await page.goto("/");

  await selectStudentWeather(page, 1, /좋아요 선택/);
  await setTeacherPin(page, "2468");
  await page.getByRole("button", { name: "설정 열기" }).click();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("오늘 기록을 모두 초기화할까요?");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "오늘 기록 초기화" }).click();

  await expect(page.getByText("1명")).toBeVisible();
  await expect(page.getByLabel("학생 번호 격자").getByRole("button", { name: "1번 ☀️ 맑음" })).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("오늘 기록을 모두 초기화할까요?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "오늘 기록 초기화" }).click();

  await expect(page.getByText("0명")).toBeVisible();
  await expect(page.getByLabel("학생 번호 격자").getByRole("button", { name: /^1번$/ })).toBeVisible();
});
