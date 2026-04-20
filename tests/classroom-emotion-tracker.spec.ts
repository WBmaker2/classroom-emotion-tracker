import { expect, test } from "@playwright/test";

test("student check-in and teacher mode work", async ({ page }) => {
  await page.goto("/");

  const studentGrid = page.getByLabel("학생 번호 격자");
  const studentOne = studentGrid.getByRole("button", { name: /^1번/ });

  await studentOne.click();
  await page.getByRole("button", { name: /좋아요 선택/ }).click();

  await expect(studentOne).toBeVisible();
  await expect(studentOne).toHaveAccessibleName(/선택 완료/);
  await expect(page.getByText("1명").first()).toBeVisible();

  await page.getByRole("button", { name: "선생님 모드 열기" }).click();
  await page.getByLabel("새 PIN", { exact: true }).fill("2468");
  await page.getByLabel("새 PIN 확인", { exact: true }).fill("2468");
  await page.getByRole("button", { name: "PIN 설정" }).click();

  await expect(page.getByText("선생님 모드")).toBeVisible();
  await expect(studentOne).toHaveAccessibleName(/맑음/);
});
