import { expect, test } from "@playwright/test";

test("mobile navigation opens by keyboard and restores focus on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/v1/**", route => route.fulfill({ status: 401, json: { code: "authentication_required" } }));
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open navigation" });
    await trigger.focus();
    await trigger.press("Enter");
    const navigation = page.getByRole("dialog", { name: "Navigation" });
    await expect(navigation).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await navigation.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(navigation).toBeHidden();
});

test("form builder edits and saves values through the migrated controls", async ({ page }) => {
    const draft = { title: "Workshop", description: "", fields: [] };
    const form = { id: 41, revision: 1, draft, publishedVersion: 0, published: null };
    await page.route("**/api/v1/**", async route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/renewals") || path.endsWith("/users/me")) {
            await route.fulfill({ json: { id: 7, firstName: "Test", lastName: "Admin",
                email: "fixture@example.invalid", role: "admin", permissions: ["forms.manage"], verified: false } });
        } else if (path.endsWith("/admin/forms/41")) {
            await route.fulfill({ json: form });
        } else if (path.endsWith("/admin/forms/41/draft")) {
            const body = route.request().postDataJSON();
            expect(body).toMatchObject({ revision: 1, draft: { fields: [{ label: "Seats", type: "integer", required: true }] } });
            await route.fulfill({ json: { revision: 2, draft: body.draft } });
        } else {
            await route.fulfill({ json: [] });
        }
    });

    await page.goto("/admin/forms/41");
    const add = page.getByRole("button", { name: "Add field" });
    await add.press("Enter");
    await page.getByRole("menuitem", { name: "Text", exact: true }).click();
    await page.getByLabel("Field label").fill("Seats");
    const fieldType = page.getByRole("combobox", { name: "Field type" });
    await fieldType.click();
    await page.getByRole("option", { name: "Whole number" }).click();
    await expect(fieldType).toContainText("Whole number");
    await page.getByRole("checkbox", { name: "Required answer" }).check();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.", { exact: true })).toBeVisible();
});

test("a submitted answer retains its server validation message", async ({ page }) => {
    const form = { id: 41, version: 1, definition: { title: "Workshop", description: "",
        fields: [{ id: "seats", label: "Seats", type: "integer", required: true }] } };
    await page.route("**/api/v1/**", async route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/renewals") || path.endsWith("/users/me")) {
            await route.fulfill({ json: { id: 8, firstName: "Test", lastName: "Member", email: "member@example.invalid",
                role: "user", permissions: ["forms.browse", "submissions.own"], verified: false } });
        } else if (path.endsWith("/forms/41")) {
            await route.fulfill({ json: form });
        } else if (path.endsWith("/submissions/mine")) {
            await route.fulfill({ body: "null", contentType: "application/json" });
        } else if (path.endsWith("/submissions")) {
            await route.fulfill({ status: 422, json: {
                code: "invalid_answers", error: "Correct the highlighted answers.",
                errors: { seats: "Enter at least two seats." },
            } });
        } else {
            await route.fulfill({ json: [] });
        }
    });

    await page.goto("/forms/41");
    const seats = page.getByLabel("Seats (required)");
    await seats.fill("1");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(seats).toHaveAttribute("aria-invalid", "true");
    await expect(seats).toHaveAccessibleDescription("Enter at least two seats.");
});

test("a reviewer can insert a field mention by keyboard", async ({ page }) => {
    const review = { id: 53, version: 1, revision: 1, status: "submitted", userName: "Test Member",
        userEmail: "member@example.invalid", values: { seats: 1 }, definition: { title: "Workshop", description: "",
        fields: [{ id: "seats", label: "Seats", type: "integer", required: true }] } };
    await page.route("**/api/v1/**", async route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/renewals") || path.endsWith("/users/me")) {
            await route.fulfill({ json: { id: 7, firstName: "Test", lastName: "Reviewer", email: "reviewer@example.invalid",
                role: "admin", permissions: ["submissions.review"], verified: false } });
        } else if (route.request().method() === "PATCH") {
            const body = route.request().postDataJSON();
            expect(body).toMatchObject({ revision: 1, decision: "changes_requested",
                comment: [{ text: "Please check " }, { fieldId: "seats" }] });
            await route.fulfill({ json: { ...review, revision: 2, status: "changes_requested", comment: body.comment } });
        } else if (path.endsWith("/admin/submissions/53")) {
            await route.fulfill({ json: review });
        } else {
            await route.fulfill({ json: [] });
        }
    });

    await page.goto("/admin/submissions/53");
    const editor = page.getByLabel("Review comment");
    await editor.fill("Please check @");
    await expect(page.getByRole("group", { name: "Field mentions" })).toBeVisible();
    await editor.press("Enter");
    await expect(editor).toHaveValue("Please check @seats ");
    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByRole("heading", { name: "Review feedback" })).toBeVisible();
});
