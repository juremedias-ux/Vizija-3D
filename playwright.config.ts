import { tmpdir } from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

// Ločena testna baza; vrednost podedujejo tudi delovni procesi testov.
process.env.E2E_DATABASE_PATH ??= path.join(
  tmpdir(),
  `vizija-e2e-${process.pid}.sqlite`,
);

const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: process.env.E2E_DATABASE_PATH,
      RATE_LIMIT_MAX: "1000",
    },
  },
});
