import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PermissionGuard } from "@/auth/permission-guard";
import { permissions } from "@/auth/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { axiosInstance } from "@/config/axios";
import { requestError } from "@/routes/forms/api";
import { accessKey, accessPath, readAccess } from "./api";
import type { Account, Assignment, AuditEntry, Catalog, LegacyKey, Permission, Role } from "./api";

export function AccessPage() {
    return <PermissionGuard permission={permissions.manageRoles}><AccessWorkspace /></PermissionGuard>;
}

function AccessWorkspace() {
    const catalog = useQuery({
        queryKey: [...accessKey, "catalog"],
        queryFn: () => readAccess<Catalog>(),
    });

    return (
        <section className="workspace-page">
            <div className="workspace-page-heading"><h1>Roles and access</h1></div>
            {catalog.isPending && <p role="status" className="text-sm text-muted-foreground">Loading access settings…</p>}
            {catalog.isError && <AccessError error={catalog.error} fallback="Could not load access settings." />}
            {catalog.isSuccess && (
                <>
                    <div className="grid items-start gap-5 xl:grid-cols-2">
                        <RolesPanel catalog={catalog.data} />
                        <AccountsPanel roles={catalog.data.roles} />
                    </div>
                    {catalog.data.legacyKeys.length > 0 && <LegacyApprovalPanel catalog={catalog.data} />}
                    <AuditPanel roles={catalog.data.roles} permissions={catalog.data.permissions} />
                </>
            )}
        </section>
    );
}

function useAccessChange<T>(change: (input: T) => Promise<unknown>, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: change,
        onSuccess: async () => {
            onSuccess?.();
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: accessKey }),
                queryClient.invalidateQueries({ queryKey: ["getUser"] }),
            ]);
        },
    });
}

function AccessError({ error, fallback }: { error: unknown; fallback: string }) {
    return <Alert variant="destructive" role="alert"><AlertDescription>{requestError(error, fallback)}</AlertDescription></Alert>;
}

function RoleSelect({ id, roles, value, onChange, disabled }: {
    id: string; roles: Role[]; value: string; onChange: (value: string) => void; disabled: boolean;
}) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled || roles.length === 0}>
            <SelectTrigger id={id}><SelectValue placeholder="Select a role" /></SelectTrigger>
            <SelectContent>
                <SelectGroup>{roles.map(role => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectGroup>
            </SelectContent>
        </Select>
    );
}

const panel = "flex flex-col gap-4 rounded-lg border bg-card p-5 sm:p-6";

function RolesPanel({ catalog }: { catalog: Catalog }) {
    const [editor, setEditor] = useState<"new" | number | null>(null);
    const role = catalog.roles.find(role => role.id === editor);
    const labels = new Map(catalog.permissions.map(permission => [permission.key, permission.label]));

    return (
        <section className={panel} aria-labelledby="role-list-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="role-list-title" className="text-lg font-semibold">Roles</h2>
                <Button size="sm" onClick={() => setEditor("new")} disabled={editor === "new"}>Create role</Button>
            </div>
            {editor !== null && (
                <>
                    <RoleEditor key={editor} role={role} permissions={catalog.permissions} onClose={() => setEditor(null)} />
                    <Separator />
                </>
            )}
            <ul className="divide-y">
                {catalog.roles.map(item => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                {item.builtin && <Badge variant="outline">Built in</Badge>}
                                {item.approvalEligible && <Badge variant="secondary">Approval eligible</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.permissions.map(key => labels.get(key) ?? key).join(", ")}</p>
                        </div>
                        {!item.builtin && (
                            <Button variant="outline" size="sm" onClick={() => setEditor(item.id)} aria-label={"Edit " + item.name}>Edit</Button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function RoleEditor({ role, permissions, onClose }: { role?: Role; permissions: Permission[]; onClose: () => void }) {
    const [name, setName] = useState(role?.name ?? "");
    const [key, setKey] = useState(role?.key ?? "");
    const [selected, setSelected] = useState(role?.permissions ?? []);
    const [eligible, setEligible] = useState(role?.approvalEligible ?? false);
    const approvalSafe = selected.length > 0 && permissions.every(permission => !selected.includes(permission.key) || permission.approvalSafe);
    const save = useAccessChange<void>(async () => {
        const body = { name, key, permissions: selected, approvalEligible: eligible };
        if (role) return axiosInstance.put(accessPath + "/roles/" + role.id, body);
        return axiosInstance.post(accessPath + "/roles", body);
    }, onClose);

    return (
        <form onSubmit={event => { event.preventDefault(); save.mutate(); }}>
            <FieldSet disabled={save.isPending}>
                <FieldLegend variant="label">{role ? "Edit " + role.name : "New custom role"}</FieldLegend>
                <FieldGroup className="gap-4">
                    <Field>
                        <FieldLabel htmlFor="role-name">Name</FieldLabel>
                        <Input id="role-name" value={name} maxLength={80} required onChange={event => setName(event.target.value)} />
                    </Field>
                    {!role && (
                        <Field>
                            <FieldLabel htmlFor="role-key">Role key</FieldLabel>
                            <Input id="role-key" value={key} maxLength={64} pattern="[a-z][a-z0-9_\\-]{0,63}" required
                                onChange={event => setKey(event.target.value)} />
                            <FieldDescription>Start with a lowercase letter. Use lowercase letters, numbers, hyphens, or underscores.</FieldDescription>
                        </Field>
                    )}
                    <FieldSet className="gap-2">
                        <FieldLegend variant="label">Permissions</FieldLegend>
                        {permissions.filter(permission => !permission.reserved).map(permission => (
                            <Field key={permission.key} orientation="horizontal">
                                <Checkbox id={"permission-" + permission.key} checked={selected.includes(permission.key)}
                                    disabled={eligible && !permission.approvalSafe}
                                    onCheckedChange={checked => setSelected(current => checked
                                        ? [...current, permission.key]
                                        : current.filter(key => key !== permission.key))} />
                                <FieldLabel htmlFor={"permission-" + permission.key}>{permission.label}</FieldLabel>
                            </Field>
                        ))}
                    </FieldSet>
                    <Field orientation="horizontal">
                        <Checkbox id="approval-eligible" checked={eligible} disabled={!eligible && !approvalSafe}
                            aria-describedby="approval-role-help" onCheckedChange={checked => setEligible(checked === true)} />
                        <div>
                            <FieldLabel htmlFor="approval-eligible">Allow forms to grant this role</FieldLabel>
                            <FieldDescription id="approval-role-help">Approval roles can include member permissions. Turning this off suspends access from approval grants for this role.</FieldDescription>
                        </div>
                    </Field>
                    {save.isError && <AccessError error={save.error} fallback="Could not save the role." />}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={save.isPending || !name.trim() || selected.length === 0}>
                            {save.isPending ? "Saving…" : "Save role"}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </FieldGroup>
            </FieldSet>
        </form>
    );
}

function AccountsPanel({ roles }: { roles: Role[] }) {
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Account>();
    const accounts = useQuery({
        queryKey: [...accessKey, "accounts", search],
        queryFn: () => readAccess<Account[]>("/accounts", { q: search }),
    });
    const matches = accounts.data ?? [];

    return (
        <section className={panel} aria-labelledby="access-accounts-title">
            <h2 id="access-accounts-title" className="text-lg font-semibold">Account assignments</h2>
            <form onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setSelected(undefined); }}>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="account-search">Find by name or email</FieldLabel>
                        <div className="flex gap-2">
                            <Input id="account-search" value={input} maxLength={160} onChange={event => setInput(event.target.value)} />
                            <Button variant="outline" type="submit">Search</Button>
                        </div>
                    </Field>
                </FieldGroup>
            </form>
            {accounts.isPending && <p role="status" className="text-sm text-muted-foreground">Loading accounts…</p>}
            {accounts.isError && <AccessError error={accounts.error} fallback="Could not load accounts." />}
            {accounts.data?.length === 0 && <p className="text-sm text-muted-foreground">No matching accounts.</p>}
            {matches.length > 0 && (
                <Field>
                    <FieldLabel htmlFor="account-selection">Account</FieldLabel>
                    <Select value={selected ? accountKey(selected) : ""} onValueChange={value => setSelected(matches.find(account => accountKey(account) === value))}>
                        <SelectTrigger id="account-selection"><SelectValue placeholder="Select an account" /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {matches.map(account => (
                                    <SelectItem key={accountKey(account)} value={accountKey(account)}>
                                        {account.name || account.email} · {account.email} · {account.type === "admin" ? "Admin" : "Member account"}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {matches.length === 40 && <FieldDescription>Showing the first 40 accounts. Search to narrow the list.</FieldDescription>}
                </Field>
            )}
            {selected && <AccountRoles key={accountKey(selected)} account={selected} roles={roles} />}
        </section>
    );
}

function accountKey(account: Account) {
    return account.type + "/" + account.id;
}

function AccountRoles({ account, roles }: { account: Account; roles: Role[] }) {
    const [selectedRole, setSelectedRole] = useState("");
    const path = "/accounts/" + accountKey(account);
    const assignments = useQuery({
        queryKey: [...accessKey, path, "roles"],
        queryFn: () => readAccess<Assignment[]>(path + "/roles"),
    });
    const change = useAccessChange(async ({ method, target }: { method: "put" | "delete"; target: string }) =>
        axiosInstance.request({ method, url: accessPath + path + target }), () => setSelectedRole(""));
    const available = roles.filter(role =>
        (role.key !== "role-manager" || account.type === "admin") &&
            !assignments.data?.some(item => item.roleId === role.id && !item.submissionId));
    const canAssign = available.some(role => String(role.id) === selectedRole);

    return (
        <>
            <Separator />
            {assignments.isPending && <p role="status" className="text-sm text-muted-foreground">Loading assignments…</p>}
            {assignments.isError && <AccessError error={assignments.error} fallback="Could not load assignments." />}
            {assignments.data?.length === 0 && <p className="text-sm text-muted-foreground">This account has no roles.</p>}
            {assignments.data && (
                <ul className="divide-y">
                    {assignments.data.map(item => {
                        const source = item.submissionId ? "Approval · Submission #" + item.submissionId : "Direct assignment";
                        return (
                            <li key={item.roleId + "/" + (item.submissionId ?? "direct")} className="flex items-start justify-between gap-3 py-2">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{source}{item.revoked ? " · Revoked" : !item.active && " · Inactive"}</p>
                                </div>
                                {!item.revoked && (
                                    <Button size="sm" variant="outline" disabled={change.isPending} aria-label={"Revoke " + item.name + " · " + source}
                                        onClick={() => change.mutate({ method: "delete", target: item.submissionId ? "/approvals/" + item.submissionId : "/roles/" + item.roleId })}>
                                        Revoke
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
            {assignments.isSuccess && available.length > 0 && (
                <form onSubmit={event => { event.preventDefault(); if (canAssign) change.mutate({ method: "put", target: "/roles/" + selectedRole }); }}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="assign-role">Assign a role</FieldLabel>
                            <div className="flex items-start gap-2">
                                <RoleSelect id="assign-role" value={canAssign ? selectedRole : ""} onChange={setSelectedRole} roles={available} disabled={change.isPending} />
                                <Button type="submit" disabled={!canAssign || change.isPending}>Assign</Button>
                            </div>
                        </Field>
                    </FieldGroup>
                </form>
            )}
            {change.isError && <AccessError error={change.error} fallback="Could not change the assignment." />}
        </>
    );
}

function LegacyApprovalPanel({ catalog }: { catalog: Catalog }) {
    return (
        <section className={panel} aria-labelledby="legacy-approval-title">
            <h2 id="legacy-approval-title" className="text-lg font-semibold">Legacy approval roles</h2>
            <p className="text-sm text-muted-foreground">Map a legacy key to activate its recorded grants and use the selected role for pending approvals on older form versions.</p>
            <ul className="divide-y">
                {catalog.legacyKeys.map(item => <LegacyApprovalRow key={item.key} item={item} roles={catalog.roles} />)}
            </ul>
        </section>
    );
}

function LegacyApprovalRow({ item, roles }: { item: LegacyKey; roles: Role[] }) {
    const [selected, setSelected] = useState("");
    const options = roles.filter(role => role.approvalEligible);
    const map = useAccessChange<void>(async () => axiosInstance.put(accessPath + "/legacy-approval-roles/" + encodeURIComponent(item.key), { roleId: Number(selected) }));
    const id = "legacy-key-" + item.key;
    const role = roles.find(role => role.id === item.roleId);
    return (
        <li className="py-3">
            {role ? <p className="text-sm"><span className="font-medium">{item.key}</span> → {role.name}{!role.approvalEligible && " (inactive)"}</p> : (
                <form onSubmit={event => { event.preventDefault(); if (selected) map.mutate(); }}>
                    <FieldGroup className="gap-3">
                        <Field>
                            <FieldLabel htmlFor={id}>{item.key}</FieldLabel>
                            <div className="flex gap-2">
                                <RoleSelect id={id} value={selected} onChange={setSelected} roles={options} disabled={map.isPending} />
                                <Button variant="outline" type="submit" disabled={!selected || map.isPending}>Map key</Button>
                            </div>
                            {options.length === 0 && <FieldDescription>Create an eligible approval role to map this key.</FieldDescription>}
                        </Field>
                        {map.isError && <AccessError error={map.error} fallback="Could not map this approval key." />}
                    </FieldGroup>
                </form>
            )}
        </li>
    );
}

const auditActions: Record<string, string> = {
    "role.assigned": "Assigned role",
    "role.revoked": "Revoked role",
    "role.created": "Created role",
    "role.edited": "Edited role",
    "role.bootstrapped": "Established the first Role Manager",
    "approval.granted": "Granted role by approval",
    "approval.revoked": "Revoked approval grant",
    "approval.legacy_mapped": "Mapped legacy approval key",
};

function AuditPanel({ roles, permissions }: { roles: Role[]; permissions: Permission[] }) {
    const audit = useInfiniteQuery({
        queryKey: [...accessKey, "audit"],
        initialPageParam: undefined as number | undefined,
        queryFn: ({ pageParam }) => readAccess<AuditEntry[]>("/audit", { before: pageParam }),
        getNextPageParam: last => last.length === 50 ? last[last.length - 1].id : undefined,
    });
    const entries = audit.data?.pages.flat() ?? [];
    const labels = new Map(permissions.map(permission => [permission.key, permission.label]));
    return (
        <section className={panel} aria-labelledby="access-audit-title">
            <h2 id="access-audit-title" className="text-lg font-semibold">Access history</h2>
            {audit.isPending && <p role="status" className="text-sm text-muted-foreground">Loading access history…</p>}
            {audit.isError && <AccessError error={audit.error} fallback="Could not load access history." />}
            {audit.isSuccess && entries.length === 0 && <p className="text-sm text-muted-foreground">No access changes recorded.</p>}
            <ul className="divide-y">
                {entries.map(entry => {
                    const detail = entry.detail;
                    const roleName = detail.after?.name ?? roles.find(role => role.id === detail.roleId)?.name ?? detail.roleKey;
                    const target = detail.accountId ? (detail.accountType === "admin" ? "Admin #" : "Account #") + detail.accountId : undefined;
                    const source = detail.submissionId ? "Submission #" + detail.submissionId : detail.legacyKey;
                    const actorID = entry.actorId ? (entry.actorType === "admin" ? "Admin #" : "Account #") + entry.actorId : "System";
                    const actor = entry.actorName ? entry.actorName + " (" + actorID + ")" : actorID;
                    const describe = (value: NonNullable<AuditEntry["detail"]["after"]>) =>
                        [value.name, value.approvalEligible ? "Approval eligible" : "Manual assignment", ...value.permissions.map(key => labels.get(key) ?? key)].join(" · ");
                    return (
                        <li key={entry.id} className="flex flex-col gap-1 py-3">
                            <p className="font-medium">{auditActions[entry.action] ?? entry.action}{roleName && " · " + roleName}</p>
                            <p className="text-sm text-muted-foreground">
                                {[actor, target, source].filter(Boolean).join(" · ")} · <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString()}</time>
                            </p>
                            {detail.before && <p className="text-sm text-muted-foreground">Previous · {describe(detail.before)}</p>}
                            {detail.after && <p className="text-sm text-muted-foreground">Saved · {describe(detail.after)}</p>}
                        </li>
                    );
                })}
            </ul>
            {audit.hasNextPage && (
                <Button className="w-fit" variant="outline" disabled={audit.isFetchingNextPage} onClick={() => void audit.fetchNextPage()}>
                    {audit.isFetchingNextPage ? "Loading…" : "Load older changes"}
                </Button>
            )}
        </section>
    );
}
