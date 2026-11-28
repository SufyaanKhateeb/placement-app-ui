import { expect, test } from "@playwright/test";

test("sign-in labels errors, reveals a password, and keeps user and admin credentials separate", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/v1/**", route => route.request().url().endsWith("/providers")
        ? route.fulfill({ json: { google: true } })
        : route.fulfill({ status: 401, json: { code: "authentication_required" } }));

    await page.goto("/login?from=%2Fforms");
    await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", "/api/v1/auth/google");
    await page.getByRole("button", { name: "Sign In with Email" }).click();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAccessibleDescription("Invalid email address");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("example fixture password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await page.getByRole("navigation", { name: "Sign-in type" }).getByRole("link", { name: "Admin" }).click();
    await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", "/api/v1/auth/google/admin");
    await expect(password).toHaveValue("");
    await expect(password).toHaveAttribute("type", "password");
});

test("Google connection shows a retryable loading failure and a confirmed connected account", async ({ page }) => {
    let tries = 0;
    await page.route("**/api/v1/**", route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/users/me")) return route.fulfill({ json: {
            id: 7, firstName: "Test", lastName: "User", email: "student@example.invalid", role: "user",
            permissions: ["forms.browse"], verified: true,
        } });
        if (path.endsWith("/providers")) return route.fulfill({ json: { google: true } });
        if (path.endsWith("/google/link")) {
            tries++;
            return tries === 1
                ? route.fulfill({ status: 500, json: {} })
                : route.fulfill({ json: { linked: true } });
        }
        return route.fulfill({ json: {} });
    });
    await page.goto("/account");
    const connection = page.getByRole("region", { name: "Google sign-in" });
    await expect(connection.getByRole("alert")).toContainText("Could not check your Google connection.");
    await connection.getByRole("button", { name: "Try again" }).click();
    await expect(connection.getByText("Connected", { exact: true })).toBeVisible();
    await expect(connection.getByText("student@example.invalid", { exact: true })).toBeVisible();
});
