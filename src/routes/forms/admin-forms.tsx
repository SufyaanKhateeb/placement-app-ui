import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, CircleCheck, Eye, FileText, Pencil, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PermissionGuard } from "@/auth/permission-guard";
import { permissions } from "@/auth/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { api } from "@/config/api";
import { adminFormsPath, getAdminForm, isDraftConflict, requestError } from "./api";
import type { AdminForm, FieldType, FormDefinition, FormField, FormSummary } from "./api";
import { FormPreview } from "./form-preview";
import { BuilderWorkspace } from "./builder-workspace";


import { DirectoryItems, DirectoryNoResults, DirectoryToolbar } from "./directory";
import { initialDirectoryControls } from "./directory-controls";

const publicationStatuses = [
    { value: "draft", label: "Draft" },
    { value: "live", label: "Live" },
    { value: "live_with_draft", label: "Live with draft" },
];

export function AdminFormsPage() {
    return <PermissionGuard permission={permissions.manageForms}><AdminFormsList /></PermissionGuard>;
}

function AdminFormsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const forms = useQuery({
        queryKey: ["adminForms"],
        queryFn: async () => (await api.get<FormSummary[]>(adminFormsPath)).data,
        retry: false,
    });
    const create = useMutation({
        mutationFn: async () => (await api.post<AdminForm>(adminFormsPath, {})).data,
        onSuccess: form => {
            queryClient.invalidateQueries({ queryKey: ["adminForms"] });
            navigate(adminFormsPath + "/" + form.id);
        },
    });

    const [controls, setControls] = useState(initialDirectoryControls);
    const query = controls.query.trim().toLowerCase();
    const items = forms.data?.map(form => {
        const status = form.publishedVersion > 0 ? (form.hasDraft ? "live_with_draft" : "live") : "draft";
        return { form, status };
    }).filter(({ form, status }) => form.title.toLowerCase().includes(query) &&
        (controls.status === "all" || controls.status === status)) ?? [];

    return (
        <section className="workspace-directory">
            <header className="directory-heading">
                <h1>Manage forms</h1>
                <Button type="button" size="sm" className="h-8 gap-2" onClick={() => create.mutate()} disabled={create.isPending}>
                    <Plus data-icon="inline-start" aria-hidden="true" /> {create.isPending ? "Creating…" : "New form"}
                </Button>
            </header>
            <DirectoryToolbar controls={controls} onChange={setControls} options={publicationStatuses} searchLabel="Search forms"
                count={forms.data ? items.length + (items.length === 1 ? " form" : " forms") : undefined} />
            <div className="directory-content">
                {forms.isPending && <p role="status" className="text-sm text-muted-foreground">Loading forms…</p>}
                {forms.isError && <Alert variant="destructive"><AlertDescription>Could not load forms.</AlertDescription></Alert>}
                {create.isError && <Alert variant="destructive"><AlertDescription>{requestError(create.error, "Could not create form.")}</AlertDescription></Alert>}
                {forms.data?.length === 0 && (
                    <Empty className="mx-auto max-w-sm">
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
                            <EmptyTitle>No forms yet</EmptyTitle>
                            <EmptyDescription>Create a form to start drafting.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
                {!!forms.data?.length && items.length === 0 && (
                    <DirectoryNoResults onReset={() => setControls({ ...controls, query: "", status: "all" })} />
                )}
                {items.length > 0 && <DirectoryItems view={controls.view} items={items.map(({ form, status }) => ({
                    href: adminFormsPath + "/" + form.id,
                    title: form.title,
                    status: <span className="submission-status">{status !== "draft" && <CircleCheck className="size-3.5 text-primary" aria-hidden="true" />}
                        {publicationStatuses.find(option => option.value === status)?.label}</span>,
                    version: form.publishedVersion || undefined,
                    action: form.hasDraft ? "Edit" : "View",
                }))} />}
            </div>
        </section>
    );
}

export function FormEditorPage() {
    const { id = "" } = useParams();
    return <PermissionGuard permission={permissions.manageForms}><LoadEditor key={id} id={id} /></PermissionGuard>;
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
                const response = await api.put<{ revision: number; draft: FormDefinition }>(path + "/draft", { revision, draft });
                return { ...saved, ...response.data };
            }
            const response = await api.post<AdminForm>(path + (action === "publish" ? "/versions" : "/drafts"), { revision });
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
        <section className="form-editor-page">
            <nav className="detail-breadcrumb" aria-label="Breadcrumb">
                <Link to={adminFormsPath}>Manage forms</Link>
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <span aria-current="page">{draft ? "Form editor" : "Published form"}</span>
            </nav>
            <header className="workspace-page-heading form-editor-heading">
                <div className="min-w-0">
                    <h1 className="break-words">{current?.title || "Untitled form"}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {draft && <Badge variant="secondary">Draft</Badge>}
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
            </header>
            {notice && (
                <p role="status" className="mx-5 my-3 flex items-center gap-2 text-sm sm:mx-8">
                    <CircleCheck className="h-4 w-4 text-muted-foreground" /> {notice}
                </p>
            )}
            {change.isError && !conflict && (
                <Alert variant="destructive" className="mx-5 my-3 w-auto sm:mx-8"><AlertDescription>{requestError(change.error, "Could not update the form.")}</AlertDescription></Alert>
            )}
            {conflict && (
                <Alert variant="destructive" className="mx-5 my-3 w-auto sm:mx-8">
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
                <div className="workspace-view-enter mx-auto my-6 flex w-full max-w-2xl flex-col gap-4 px-5 py-3 sm:px-8">
                    <div className="flex items-center gap-2 border-b pb-3 text-xs font-medium text-muted-foreground">
                        <Eye className="h-4 w-4" /> {draft ? "Preview · Answers aren’t saved" : "Published form"}
                    </div>
                    <FormPreview key={JSON.stringify(current)} definition={current} allowValidation={!!draft} />
                </div>
            )}
            {!showingPreview && draft && (
                <div className="workspace-view-enter form-editor-workspace">
                    <BuilderWorkspace draft={draft} formID={saved.id} selectedID={selectedID} disabled={change.isPending}
                        onSelect={setSelectedID}
                        onDetails={details => { setDraft({ ...draft, ...details }); setNotice(""); }}
                        onAdd={addField} onUpdate={updateField} onMove={moveField}
                        onRemove={id => {
                            updateFields(fields => fields.filter(field => field.id !== id));
                            setSelectedID(null);
                        }} />
                </div>
            )}
        </section>
    );
}
