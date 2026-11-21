import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, CircleCheck, Eye, FileText, Pencil, Plus } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useGetUserQuery } from "@/auth/queryHooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/config/axios";
import { adminFormsPath, getAdminForm, isDraftConflict, requestError } from "./api";
import type { AdminForm, FieldType, FormDefinition, FormField, FormSummary } from "./api";
import { FormPreview } from "./form-preview";
import { BuilderWorkspace } from "./builder-workspace";


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
                    <Plus className="mr-2 h-4 w-4" /> {create.isPending ? "Creating…" : "New form"}
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
                                <span className="min-w-0 flex items-center gap-3"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate font-medium">{form.title}</span></span>
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
    const [selectedID, setSelectedID] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const queryClient = useQueryClient();
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved.draft);
    const path = adminFormsPath + "/" + saved.id;

    function applySnapshot(form: AdminForm) {
        setSaved(form);
        setDraft(form.draft);
        setSelectedID(id => form.draft?.fields.some(field => field.id === id) ? id : null);
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
            applySnapshot(form);
            if (action === "edit") setPreviewing(false);
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

    function addField(label: string, type: FieldType) {
        const id = crypto.randomUUID();
        updateFields(fields => [...fields, { id, label, type, required: false }]);
        setSelectedID(id);
    }

    const current = draft ?? saved.published;
    const latestDefinition = latest?.draft ?? latest?.published;
    const showingPreview = previewing || !draft;
    return (
        <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
            <Link to={adminFormsPath} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" /> All forms
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <div className="min-w-0">
                    <h1 className="break-words text-2xl font-semibold tracking-tight">{current?.title || "Untitled form"}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {draft && <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">Draft</span>}
                        {saved.publishedVersion > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium">
                                <CircleCheck className="h-3 w-3" /> Live v{saved.publishedVersion}
                            </span>
                        )}
                        {draft && <span>{dirty ? "Unsaved changes" : "Revision " + saved.revision}</span>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {draft ? (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => setPreviewing(!previewing)} aria-pressed={previewing}>
                                {previewing ? <Pencil className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {previewing ? "Back to editor" : "Preview"}
                            </Button>
                            <Button size="sm" variant="outline" disabled={!dirty || change.isPending || conflict}
                                onClick={() => change.mutate("save")}>
                                {change.isPending && change.variables === "save" ? "Saving…" : "Save draft"}
                            </Button>
                            <Button size="sm" disabled={dirty || !draft.fields.length || change.isPending || conflict}
                                onClick={() => change.mutate("publish")}>
                                {change.isPending && change.variables === "publish" ? "Publishing…" : "Publish"}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" disabled={change.isPending || conflict} onClick={() => change.mutate("edit")}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit published form
                        </Button>
                    )}
                </div>
            </div>
            {notice && (
                <p role="status" className="flex items-center gap-2 text-sm">
                    <CircleCheck className="h-4 w-4 text-muted-foreground" /> {notice}
                </p>
            )}
            {change.isError && !conflict && (
                <Alert variant="destructive"><AlertDescription>{requestError(change.error, "Could not update the form.")}</AlertDescription></Alert>
            )}
            {conflict && (
                <Alert variant="destructive">
                    <AlertTitle>Another admin changed this form</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>Your unsaved edits are still in the editor. Review the latest draft before replacing them.</p>
                        <Button size="sm" variant="outline" disabled={loadLatest.isPending} onClick={() => loadLatest.mutate()}>
                            {loadLatest.isPending ? "Loading…" : "View latest version"}
                        </Button>
                        {loadLatest.isError && <p>Could not load the latest version.</p>}
                        {latest && (
                            <div className="space-y-3">
                                <details className="rounded-lg border p-3">
                                    <summary className="cursor-pointer">Latest content, revision {latest.revision}</summary>
                                    {latestDefinition && <div className="mt-4"><FormPreview key={latest.revision} definition={latestDefinition} /></div>}
                                </details>
                                <Button size="sm" variant="outline" onClick={() => {
                                    applySnapshot(latest);
                                    setNotice("");
                                    change.reset();
                                }}>
                                    Replace editor with latest version
                                </Button>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
            {showingPreview && current && (
                <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border bg-background p-5 shadow-sm sm:p-8">
                    <div className="flex items-center gap-2 border-b pb-3 text-xs font-medium text-muted-foreground">
                        <Eye className="h-4 w-4" /> {draft ? "Preview · Answers aren’t saved" : "Published form"}
                    </div>
                    <FormPreview key={JSON.stringify(current)} definition={current} allowValidation={!!draft} />
                </div>
            )}
            {!showingPreview && draft && (
                <BuilderWorkspace draft={draft} selectedID={selectedID} disabled={change.isPending}
                    onSelect={setSelectedID}
                    onDetails={details => { setDraft({ ...draft, ...details }); setNotice(""); }}
                    onAdd={addField} onUpdate={updateField} onMove={moveField}
                    onRemove={id => {
                        updateFields(fields => fields.filter(field => field.id !== id));
                        setSelectedID(null);
                    }} />
            )}
        </section>
    );
}