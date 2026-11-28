import { expect, test } from "@playwright/test";

for (const entry of ["/login", "/register"]) {
    test(`email verification survives returning to ${entry} and refreshing`, async ({ page, context }) => {
        let holdRefresh = false;
        let allowRefresh!: () => void;
        let signalRefresh!: () => void;
        const waiting = new Promise<void>(resolve => { allowRefresh = resolve; });
        const started = new Promise<void>(resolve => { signalRefresh = resolve; });
        let authenticated = false;
        await page.route("**/api/v1/**", async route => {
            const path = new URL(route.request().url()).pathname;
            if (path === "/api/v1/auth/sessions/current/renewals" && holdRefresh) {
                signalRefresh();
                await waiting;
            }
            if (path === "/api/v1/auth/sessions/current/renewals" || path === "/api/v1/users/me") {
                await route.fulfill(authenticated
                    ? { json: { id: 7, firstName: "Test", lastName: "User", email: "fixture@example.invalid",
                        role: "user", permissions: ["forms.browse"], verified: false } }
                    : { status: 401, json: { error: "authentication required" } });
                return;
            }
            if (path === (entry === "/login" ? "/api/v1/auth/sessions" : "/api/v1/users")) {
                expect(route.request().method()).toBe("POST");
                if (entry === "/login") expect(route.request().postDataJSON().mode).toBe("user");
                await route.fulfill({ status: 202, json: { verificationRequired: true } });
                return;
            }
            if (path === "/api/v1/auth/email-verifications/current/confirmations") {
                expect(route.request().postDataJSON()).toEqual({ code: "123456" });
                authenticated = true;
                await route.fulfill(entry === "/register"
                    ? { status: 201, json: null, headers: { Location: "/api/v1/users/me" } }
                    : { status: 204 });
                return;
            }
            await route.fulfill({ json: path.endsWith("/providers") ? { google: false } : [] });
        });

        await page.goto(entry + "?from=%2Fforms");
        if (entry === "/register") {
            await page.getByLabel("First Name").fill("Test");
            await page.getByLabel("Last Name").fill("User");
        }
        await page.getByLabel("Email").fill("fixture@example.invalid");
        await page.getByLabel("Password", { exact: true }).fill("Example!2026");
        await page.getByRole("button", { name: entry === "/login" ? "Sign In with Email" : "Create account" }).click();
        const code = page.getByLabel("Email verification code");
        await expect(code).toBeVisible();
        await code.fill("123");

        const inbox = await context.newPage();
        await inbox.bringToFront();
        // Hold the signed-out session reply so the test also checks the in-flight UI.
        holdRefresh = true;
        try {
            await page.bringToFront();
            // Headless Chromium doesn't always fire visibilitychange when switching tabs.
            await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
            await started;
            await expect(code).toHaveValue("123");
        } finally {
            allowRefresh();
        }
        await expect(code).toHaveValue("123");
        await inbox.close();

        await page.reload();
        await expect(code).toBeVisible();
        await expect(code).toBeEmpty();
        await code.fill("123456");
        await page.getByRole("button", { name: "Verify email" }).click();
        await expect(page).toHaveURL(/\/forms$/);
    });
}
