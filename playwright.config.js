import { defineConfig, devices } from '@playwright/test';

// Kept small and CI-friendly: one project, headless, auto-starts an
// http-server, and points at the pre-installed Chromium so postinstall
// never re-fetches browsers.
export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    timeout: 30_000,
    expect: { timeout: 5_000 },

    webServer: {
        command: 'npx http-server . -p 8080 -c-1 --silent',
        port: 8080,
        reuseExistingServer: true,
        timeout: 20_000
    },

    use: {
        baseURL: 'http://localhost:8080',
        headless: true,
        viewport: { width: 1280, height: 800 },
        trace: 'retain-on-failure'
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use the environment's pre-installed Chromium rather than
                // whatever version Playwright would normally fetch.
                launchOptions: {
                    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
                }
            }
        }
    ]
});
