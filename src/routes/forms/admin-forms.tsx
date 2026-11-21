import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useGetUserQuery } from "@/auth/queryHooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/config/axios";
import { adminFormsPath, fieldTypes, getAdminForm, isDraftConflict, requestError } from "./api";
import type { AdminForm, FieldType, FormDefinition, FormField, FormSummary } from "./api";
import { FormPreview } from "./form-preview";

const presets = ["Name", "Email", "Group", "Subgroup"];
const selectClass = "h-10 rounded-md border border-input bg-background px-3 text-sm";

function AdminFormsGuard({ children }: PropsWithChildren) {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"] });
    if (isPending) return <p role="status" className="px-6 py-8">Checking your session…</p>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.role !== "admin") return <p className="px-6 py-8">Admin access required.</p>;
    return children;
}

export function AdminFormsPage() {
    return <AdminFormsGuard><AdminFormsList /></AdminFormsGuard>;
}

function AdminFormsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const forms = useQuery({
        queryKey: ["adminForms"],
        queryFn: async () => (await axiosInstance.get<FormSummary[]>(adminFormsPath)).data,
        retry: false,
    });
    const create = useMutation({
        mutationFn: async () => (await axiosInstance.post<AdminForm>(adminFormsPath, {})).data,
        onSuccess: form => {
            queryClient.invalidateQueries({ queryKey: ["adminForms"] });
            navigate(adminFormsPath + "/" + form.id);
        },
    });

    return (
        <section className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
            <div className="flex items-center justify-between gap-4">
                <div><Link to="/admin" className="text-sm text-muted-foreground hover:underline">Admin account</Link>
                    <h1 className="mt-2 text-2xl font-semibold">Forms</h1></div>
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    {create.isPending ? "Creating…" : "New form"}
                </Button>
            </div>
            {forms.isPending && <p role="status">Loading forms…</p>}
            {forms.isError && <Alert variant="destructive"><AlertDescription>Could not load forms.</AlertDescription></Alert>}
            {create.isError && <Alert variant="destructive"><AlertDescription>{requestError(create.error, "Could not create form.")}</AlertDescription></Alert>}
            {forms.data?.length === 0 && <p className="rounded-lg border p-5 text-sm text-muted-foreground">No forms yet.</p>}
            {!!forms.data?.length && (
                <ul className="divide-y overflow-hidden rounded-lg border">
                    {forms.data.map(form => (
                        <li key={form.id}>
                            <Link className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50" to={adminFormsPath + "/" + form.id}>
                                <span className="font-medium">{form.title}</span>
                                <span className="text-sm text-muted-foreground">
                                    {form.publishedVersion > 0 ? "Published v" + form.publishedVersion : "Draft"}
                                    {form.publishedVersion > 0 && form.hasDraft && " · Draft in progress"}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function FormEditorPage() {
    const { id = "" } = useParams();
    return <AdminFormsGuard><LoadEditor key={id} id={id} /></AdminFormsGuard>;
}

function LoadEditor({ id }: { id: string }) {
    const form = useQuery({
        queryKey: ["adminForm", id],
        queryFn: () => getAdminForm(id),
        retry: false,
        refetchOnWindowFocus: false,
    });
    if (form.isPending) return <p className="px-6 py-8" role="status">Loading form…</p>;
    if (form.isError) return <p className="px-6 py-8" role="alert">{requestError(form.error, "Could not load form.")}</p>;
    return <FormEditor initialForm={form.data} />;
}

type Action = "save" | "publish" | "edit";

function FormEditor({ initialForm }: { initialForm: AdminForm }) {
    const [saved, setSaved] = useState(initialForm);
    const [draft, setDraft] = useState(initialForm.draft);
    const [conflict, setConflict] = useState(false);
    const [latest, setLatest] = useState<AdminForm | null>(null);
    const [notice, setNotice] = useState("");
    const queryClient = useQueryClient();
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved.draft);
    const path = adminFormsPath + "/" + saved.id;

    function useSnapshot(form: AdminForm) {
        setSaved(form);
        setDraft(form.draft);
        setConflict(false);
        setLatest(null);
        queryClient.setQueryData(["adminForm", String(form.id)], form);
    }

    const change = useMutation({
        mutationFn: async (action: Action) => {
            const revision = saved.revision;
            if (action === "save") {
                const response = await axiosInstance.put<{ revision: number; draft: FormDefinition }>(path + "/draft", { revision, draft });
                return { ...saved, ...response.data };
            }
            const response = await axiosInstance.post<AdminForm>(path + (action === "publish" ? "/publish" : "/draft"), { revision });
            return response.data;
        },
        onSuccess: (form, action) => {
            useSnapshot(form);
            setNotice(action === "publish" ? "Published version " + form.publishedVersion + "." : "Draft saved.");
            queryClient.invalidateQueries({ queryKey: ["adminForms"] });
            if (action === "publish") queryClient.invalidateQueries({ queryKey: ["publishedForms"] });
        },
        onError: error => {
            setNotice("");
            if (isDraftConflict(error)) setConflict(true);
        },
    });

    const loadLatest = useMutation({
        mutationFn: () => getAdminForm(String(saved.id)),
        onSuccess: form => setLatest(form),
    });

    function updateFields(changeFields: (fields: FormField[]) => FormField[]) {
        setDraft(current => current && { ...current, fields: changeFields(current.fields) });
        setNotice("");
    }

    function updateField(id: string, patch: Partial<FormField>) {
        updateFields(fields => fields.map(field => field.id === id ? { ...field, ...patch } : field));
    }

    function moveField(index: number, offset: number) {
        updateFields(fields => {
            const next = [...fields];
            const target = index + offset;
            if (target >= 0 && target < next.length) {
                [next[index], next[target]] = [next[target], next[index]];
            }
            return next;
        });
    }

    function addField(label: string) {
        updateFields(fields => [...fields, { id: crypto.randomUUID(), label, type: "text", required: false }]);
    }

    const current = draft ?? saved.published;
    return (
        <section className="mx-auto w-full max-w-6xl space-y-5 px-6 py-10">
            <Link to={adminFormsPath} className="text-sm text-muted-foreground hover:underline">All forms</Link>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">{current?.title || "Untitled form"}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {saved.publishedVersion > 0 ? "Published version " + saved.publishedVersion : "Unpublished form"}
                        {draft && " · Draft revision " + saved.revision}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {draft ? (
                        <>
                            <Button variant="outline" disabled={!dirty || change.isPending || conflict} onClick={() => change.mutate("save")}>Save draft</Button>
                            <Button disabled={dirty || !draft.fields.length || change.isPending || conflict} onClick={() => change.mutate("publish")}>Publish</Button>
                        </>
                    ) : (
                        <Button disabled={change.isPending || conflict} onClick={() => change.mutate("edit")}>Edit published form</Button>
                    )}
                </div>
            </div>
            {dirty && !conflict && <p className="text-sm text-muted-foreground">Save your changes before publishing.</p>}
            {notice && <p role="status" className="text-sm">{notice}</p>}
            {change.isError && !conflict && <Alert variant="destructive"><AlertDescription>{requestError(change.error, "Could not update the form.")}</AlertDescription></Alert>}
            {conflict && (
                <Alert variant="destructive">
                    <AlertDescription className="space-y-3">
                        <p>Another admin changed this form. Your edits are still in the editor.</p>
                        <Button size="sm" variant="outline" disabled={loadLatest.isPending} onClick={() => loadLatest.mutate()}>View latest version</Button>
                        {loadLatest.isError && <p>Could not load the latest version.</p>}
                        {latest && (
                            <div className="space-y-3">
                                <details>
                                    <summary>Latest content, revision {latest.revision}</summary>
                                    {(latest.draft ?? latest.published) && <FormPreview key={latest.revision} definition={(latest.draft ?? latest.published)!} />}
                                </details>
                                <Button size="sm" variant="outline" onClick={() => { useSnapshot(latest); change.reset(); }}>
                                    Replace editor with latest version
                                </Button>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
            <div className={draft ? "grid items-start gap-6 lg:grid-cols-2" : "max-w-2xl"}>
                {draft && (
                    <fieldset disabled={change.isPending} className="space-y-5 rounded-lg border p-5">
                        <legend className="sr-only">Draft settings and fields</legend>
                        <div className="space-y-2">
                            <Label htmlFor="form-title">Title</Label>
                            <Input id="form-title" maxLength={120} value={draft.title} onChange={event => { setDraft({ ...draft, title: event.target.value }); setNotice(""); }} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="form-description">Description</Label>
                            <textarea id="form-description" className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm"
                                maxLength={2000} value={draft.description} onChange={event => { setDraft({ ...draft, description: event.target.value }); setNotice(""); }} />
                        </div>
                        <h2 className="font-semibold">Fields</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" disabled={draft.fields.length >= 100} onClick={() => addField("New field")}>Add field</Button>
                            {presets.map(preset => (
                                <Button key={preset} size="sm" variant="ghost" disabled={draft.fields.length >= 100} onClick={() => addField(preset)}>
                                    Add {preset.toLowerCase()}
                                </Button>
                            ))}
                        </div>
                        {draft.fields.map((field, index) => (
                            <div className="space-y-3 rounded-md border p-3" key={field.id}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Label htmlFor={"label-" + field.id}>Field label</Label>
                                    <Input id={"label-" + field.id} maxLength={120} value={field.label}
                                        onChange={event => updateField(field.id, { label: event.target.value })} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Label htmlFor={"type-" + field.id}>Type</Label>
                                    <select id={"type-" + field.id} className={selectClass} value={field.type}
                                        onChange={event => updateField(field.id, { type: event.target.value as FieldType })}>
                                        {fieldTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                    </select>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={field.required} onChange={event => updateField(field.id, { required: event.target.checked })} />
                                        Required
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => moveField(index, -1)}>Move up</Button>
                                    <Button size="sm" variant="ghost" disabled={index === draft.fields.length - 1} onClick={() => moveField(index, 1)}>Move down</Button>
                                    <Button size="sm" variant="ghost" onClick={() => updateFields(fields => fields.filter(item => item.id !== field.id))}>Remove</Button>
                                </div>
                            </div>
                        ))}
                    </fieldset>
                )}
                {current && <div className="rounded-lg border p-5">
                    <p className="mb-4 text-sm text-muted-foreground">{draft ? "Draft preview" : "Published form"}</p>
                    <FormPreview key={saved.revision + JSON.stringify(current)} definition={current} allowValidation={!!draft} />
                </div>}
            </div>
        </section>
    );
}