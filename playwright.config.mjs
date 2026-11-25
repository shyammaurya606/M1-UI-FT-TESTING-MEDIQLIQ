// Visible, manual Playwright runner rather than unattended tests.
export default {
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { headless: false, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: 'list'
};
