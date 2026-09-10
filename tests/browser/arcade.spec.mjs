import { test, expect } from "@playwright/test";

test("arcade starts, pauses, loses and restarts", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.clock.install();
  await page.goto("arcade/");
  await page.getByRole("button", { name: "CHƠI NGAY" }).click();
  await page.clock.runFor(9000);
  await expect(
    page.getByRole("heading", { name: "Thêm ván nữa chứ?" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("điểm");
  await page.getByRole("button", { name: "CHƠI LẠI" }).click();
  await page.keyboard.press("p");
  await expect(
    page.getByRole("heading", { name: "Đang tạm dừng" }),
  ).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByText("60s", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "TIẾP TỤC →" }).click();
  await page.keyboard.down("ArrowRight");
  await page.clock.runFor(1000);
  await page.keyboard.up("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Đang tạm dừng" }),
  ).not.toBeVisible();
});

test("survives sixty seconds, persists score, and supports narrow screens", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.clock.install();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("arcade/");
  await page.getByRole("button", { name: "CHƠI NGAY" }).click();
  await page.clock.runFor(61000);
  await expect(
    page.getByRole("heading", { name: "Cuối tuần yên bình!" }),
  ).toBeVisible();
  const best = await page.evaluate(() =>
    Number(localStorage.getItem("ai-morning-bug-rain-v1")),
  );
  expect(best).toBeGreaterThanOrEqual(1100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText(best.toLocaleString("vi-VN"), { exact: true }),
  ).toBeVisible();
});
