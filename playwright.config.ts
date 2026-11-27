import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    use: { baseURL: "http://localhost:3001" },
    webServer: {
        command: "npm exec -- vite --port 3001 --strictPort",
        url: "http://localhost:3001",
        reuseExistingServer: false,
    },
});
