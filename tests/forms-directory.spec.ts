import { expect, test, type Page } from "@playwright/test";

async function signInWithFixture(page: Page, role: "user" | "admin", permissions: string[]) {
    await page.route("**/api/v1/**", route => {
        const path = new URL(route.request().url()).pathname;
        return route.fulfill({ json: path.endsWith("/users/me")
            ? { id: 7, firstName: "Test", lastName: "User", email: "user@example.invalid", role, permissions, verified: true }
            : {} });
    });
}

async function chooseStatus(page: Page, status: string) {
    await page.getByRole("combobox", { name: "Filter by status" }).press("Enter");
    await page.getByRole("option", { name: status, exact: true }).click();
}

test("students can combine search and status while switching between list and blocks", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInWithFixture(page, "user", ["forms.browse", "submissions.own"]);
    await page.route("**/api/v1/forms", route => route.fulfill({ json: [
        { id: 41, title: "Placement registration", publishedVersion: 2, submissionStatus: "changes_requested" },
        { id: 42, title: "Placement orientation", publishedVersion: 1, submissionStatus: "approved" },
        { id: 43, title: "Resume review", publishedVersion: 1, submissionStatus: "approved" },
    ] }));
    await page.goto("/forms");
    await expect(page.getByRole("region", { name: "Needs your attention" })
        .getByRole("link", { name: /Placement registration.*Revise/ })).toBeVisible();

    const search = page.getByRole("textbox", { name: "Search forms" });
    await search.fill("Placement");
    await chooseStatus(page, "Approved");
    await page.getByRole("button", { name: "Block view" }).press("Enter");
    await expect(page.getByRole("button", { name: "Block view" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-view="blocks"]').getByRole("link")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Placement orientation/ })).toBeVisible();
    await expect(search).toHaveValue("Placement");
    await expect(page.getByRole("combobox", { name: "Filter by status" })).toHaveText("Approved");

    await search.fill("no such form");
    await page.getByRole("button", { name: "Clear search and filters" }).click();
    await expect(page.getByRole("link", { name: /Resume review/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Block view" })).toHaveAttribute("aria-pressed", "true");
});

test("admins can switch layouts and search beyond the first page of submissions", async ({ page }) => {
    await signInWithFixture(page, "admin", ["forms.manage", "submissions.review"]);
    await page.route("**/api/v1/admin/forms", route => route.fulfill({ json: [
        { id: 41, title: "Placement registration", publishedVersion: 2, hasDraft: true },
        { id: 42, title: "Placement orientation", publishedVersion: 0, hasDraft: true },
    ] }));
    await page.route("**/api/v1/admin/submissions*", route => {
        const params = new URL(route.request().url()).searchParams;
        const search = params.get("q");
        const submitted = { version: 1, userEmail: "user@example.invalid", status: "submitted" };
        if (!search) {
            return route.fulfill({ json: {
                items: [{ ...submitted, id: 90, formTitle: "Recent submission", userName: "Latest Student" }],
                nextBefore: 90,
            } });
        }
        if (search === "Earlier" && params.get("status") === "submitted") {
            const before = params.get("before");
            return route.fulfill({ json: {
                items: [{ ...submitted, id: before ? 12 : 20, formTitle: before ? "Workshop" : "Placement",
                    userName: "Earlier Student" }],
                nextBefore: before ? undefined : 20,
            } });
        }
        return route.fulfill({ json: { items: [] } });
    });
    await page.goto("/admin/forms");
    await page.getByRole("textbox", { name: "Search forms" }).fill("placement");
    await chooseStatus(page, "Draft");
    await page.getByRole("button", { name: "Block view" }).click();
    await expect(page.locator('[data-view="blocks"]').getByRole("link", { name: /Placement orientation/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Placement registration/ })).toHaveCount(0);

    await page.getByRole("link", { name: "Submissions" }).click();
    await expect(page.getByRole("link", { name: /Latest Student/ })).toBeVisible();
    await page.getByRole("textbox", { name: "Search submissions" }).fill("Earlier");
    await chooseStatus(page, "Awaiting review");
    await expect(page.getByRole("link", { name: /Placement.*Earlier Student/ })).toBeVisible();
    await page.getByRole("button", { name: "Block view" }).click();
    await page.getByRole("button", { name: "Load more results" }).click();
    await expect(page.locator('[data-view="blocks"]').getByRole("link", { name: /Workshop.*Earlier Student/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Latest Student/ })).toHaveCount(0);
});
