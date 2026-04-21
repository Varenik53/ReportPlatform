import { stat } from "node:fs/promises";

import { expect, test } from "@playwright/test";

test("creates a report run and downloads the generated xlsx artifact", async ({
  page,
}, testInfo) => {
  const reportsSection = page.locator("section[aria-labelledby='reports-list-title']");
  const runsSection = page.locator("section[aria-labelledby='runs-list-title']");
  const runFormSection = page.locator("section[aria-labelledby='run-form-title']");

  await page.goto("/");
  await expect(reportsSection.locator("li")).toHaveCount(2);

  const firstRunIdLocator = runsSection.locator("li").first().locator("[id^='run-title-']");
  const initialFirstRunId =
    (await runsSection.locator("li").count()) > 0
      ? ((await firstRunIdLocator.textContent()) ?? "").trim()
      : "";

  await runFormSection.locator("button").nth(0).click();
  await expect(runFormSection.getByRole("textbox")).toHaveValue(/periodFrom/);
  await runFormSection.locator("button").nth(1).click();

  await expect
    .poll(async () => {
      const runItems = runsSection.locator("li");
      if ((await runItems.count()) === 0) {
        return "";
      }

      return ((await runItems.first().locator("[id^='run-title-']").textContent()) ?? "").trim();
    })
    .not.toBe(initialFirstRunId || "");

  const firstRun = runsSection.locator("li").first();
  const downloadLink = firstRun.locator("a[href^='/api/report-runs/'][href$='/download']");

  await expect(downloadLink).toBeVisible({ timeout: 45_000 });

  const downloadPromise = page.waitForEvent("download");
  await downloadLink.click();

  const download = await downloadPromise;
  const filePath = testInfo.outputPath(download.suggestedFilename());

  await download.saveAs(filePath);

  const fileStat = await stat(filePath);
  expect(fileStat.size).toBeGreaterThan(0);
});
