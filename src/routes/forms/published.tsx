import { useState } from "react";
import { useGetUserQuery } from "@/auth/queryHooks";
import { permissions } from "@/auth/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { api, isApiError } from "@/config/api";
import { publishedFormsPath, requestError } from "./api";
import type { FormAnswerErrors, FormAnswers, FormSubmission, FormSummary, PublishedForm } from "./api";
import { AnswerForm } from "./form-preview";
import { SubmissionStatusBadge } from "./submission-status";

import { DirectoryItems, DirectoryNoResults, DirectoryToolbar } from "./directory";
import { initialDirectoryControls, reviewStatuses } from "./directory-controls";

const publishedFormsListKey = ["publishedForms", "list"];

const submissionStatuses = [
    { value: "not_submitted", label: "Not submitted" },
    ...reviewStatuses,
];

function publishedDirectoryItem(form: FormSummary, showActions: boolean) {
    const status = form.submissionStatus;
    return {
        href: publishedFormsPath + "/" + form.id,
        title: form.title,
        status: status && <SubmissionStatusBadge status={status} quiet />,
        version: form.publishedVersion,
        action: showActions ? (status === "changes_requested" ? "Revise" : status === "not_submitted" ? "Start" : "View") : undefined,
    };
}

export function PublishedFormsPage() {
    const { data: user } = useGetUserQuery({ queryKey: ["getUser"] });
    const [controls, setControls] = useState(initialDirectoryControls);
    const forms = useQuery({
        queryKey: [...publishedFormsListKey, user?.role, user?.id, user?.permissions.includes(permissions.browseRestricted)],
        queryFn: async () => (await api.get<FormSummary[]>(publishedFormsPath)).data,
        retry: false,
    });
    const canFilterStatus = user?.accountType === "user" && user.permissions.includes(permissions.ownSubmissions);
    const status = canFilterStatus ? controls.status : "all";
    const query = controls.query.trim().toLowerCase();
    const visible = forms.data?.filter(form => form.title.toLowerCase().includes(query) &&
        (status === "all" || form.submissionStatus === status)) ?? [];
    const ready = forms.data !== undefined;
    const needsRevision = (form: FormSummary) => form.submissionStatus === "changes_requested";
    const needsAttention = canFilterStatus && status === "all" ? visible.filter(needsRevision) : [];
    const otherForms = needsAttention.length ? visible.filter(form => !needsRevision(form)) : visible;

    return (
        <section className="workspace-directory">
            <header className="directory-heading"><h1>Forms</h1></header>
            <DirectoryToolbar controls={controls} onChange={setControls}
                options={canFilterStatus ? submissionStatuses : []} searchLabel="Search forms"
                count={ready ? visible.length + (visible.length === 1 ? " form" : " forms") : undefined} />
            <div className="directory-content">
                {forms.isPending && <p role="status" className="text-sm text-muted-foreground">Loading forms…</p>}
                {forms.isError && <Alert variant="destructive"><AlertDescription>Could not load forms.</AlertDescription></Alert>}
                {forms.data?.length === 0 && (
                    <Empty className="mx-auto max-w-sm">
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
                            <EmptyTitle>No forms have been published</EmptyTitle>
                        </EmptyHeader>
                    </Empty>
                )}
                {!!forms.data?.length && visible.length === 0 && (
                    <DirectoryNoResults onReset={() => setControls({ ...controls, query: "", status: "all" })} />
                )}
                {needsAttention.length > 0 && (
                    <section aria-labelledby="forms-changes-requested">
                        <h2 className="directory-group-heading" id="forms-changes-requested">Needs your attention</h2>
                        <DirectoryItems items={needsAttention.map(form => publishedDirectoryItem(form, true))} view={controls.view} />
                    </section>
                )}
                {otherForms.length > 0 && (
                    <section aria-label={needsAttention.length ? "Other forms" : "Forms results"}>
                        {needsAttention.length > 0 && <h2 className="directory-group-heading">Other forms</h2>}
                        <DirectoryItems items={otherForms.map(form => publishedDirectoryItem(form, canFilterStatus))} view={controls.view} />
                    </section>
                )}
            </div>
        </section>
    );
}

export function PublishedFormPage() {
    const { id = "" } = useParams();

    return (
        <section className="answer-page">
            <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
                <Link to="/forms"><ArrowLeft data-icon="inline-start" aria-hidden="true" /> All forms</Link>
            </Button>
            <PublishedFormContent key={id} id={id} />
        </section>
    );
}

function PublishedFormContent({ id }: { id: string }) {
    const { data: user } = useGetUserQuery({ queryKey: ["getUser"] });
    const queryClient = useQueryClient();
    const path = publishedFormsPath + "/" + id;
    const submissionsPath = path + "/submissions";
    const submissionPath = submissionsPath + "/mine";
    const isUser = user?.accountType === "user" && user.permissions.includes(permissions.ownSubmissions);
    const submissionKey = ["publishedForms", id, "submission", user?.id];
    const form = useQuery({
        queryKey: ["publishedForms", id, user?.role, user?.id, user?.permissions.includes(permissions.browseRestricted)],
        queryFn: async () => (await api.get<PublishedForm>(path)).data,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const receipt = useQuery({
        queryKey: submissionKey,
        queryFn: async () => (await api.get<FormSubmission | null>(submissionPath)).data,
        enabled: isUser,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const [versionChanged, setVersionChanged] = useState(false);
    if (form.isPending || (isUser && receipt.isPending)) return <p role="status" className="text-sm text-muted-foreground">Loading form…</p>;
    if (form.isError || (isUser && receipt.isError)) {
        const error = form.error ?? receipt.error;
        return <Alert variant="destructive"><AlertDescription>{requestError(error, "Could not load form.")}</AlertDescription></Alert>;
    }

    const submission = receipt.data;
    const approvedAction = submission?.status === "approved" ? submission.definition.approvalAction : undefined;
    const version = submission?.version ?? form.data.version;
    const canSubmit = isUser && (!submission || submission.status === "changes_requested");
    const revision = submission?.revision;

    async function sendAnswers(values: FormAnswers) {
        try {
            const body = { version, values, ...(revision === undefined ? {} : { revision }) };
            const response = revision === undefined
                ? await api.post<FormSubmission>(submissionsPath, body)
                : await api.put<FormSubmission>(submissionPath, body);
            queryClient.setQueryData(submissionKey, response.data);
            void queryClient.invalidateQueries({ queryKey: publishedFormsListKey });
        } catch (error) {
            if (isApiError<FormAnswerErrors>(error) && error.response?.status === 409) {
                if (error.response.data.code === "version_changed") setVersionChanged(true);
                await receipt.refetch();
                void queryClient.invalidateQueries({ queryKey: publishedFormsListKey });
            }
            throw error;
        }
    }

    return (
        <div className="answer-card">
            <AnswerForm
                key={version + ":" + (revision ?? "new") + ":" + (submission?.status ?? "")}
                definition={submission?.definition ?? form.data.definition}
                publishedVersion={version}
                initialValues={submission?.values}
                feedback={submission?.status === "changes_requested" ? submission.changes : undefined}
                reviewComment={submission?.status === "changes_requested" ? submission.comment : undefined}
                notice={<>
                    {submission && (
                        <Alert role="status">
                            <AlertDescription>
                                {submission.status === "changes_requested" ? "Changes requested. Update your answers and resubmit." :
                                    submission.status === "approved" ? "Approved." : "Submitted for approval."}
                            </AlertDescription>
                        </Alert>
                    )}
                    {approvedAction?.kind === "follow_up_form" && (
                        <Button variant="outline" className="w-fit" asChild>
                            <Link to={publishedFormsPath + "/" + approvedAction.formId}>Open follow-up form</Link>
                        </Button>
                    )}
                    {submission?.grantedRole && (
                        <p className="text-sm">Application role <span className="font-medium">{submission.grantedRole.name}</span></p>
                    )}
                    {versionChanged && !submission && (
                        <Button type="button" variant="outline" className="w-fit" disabled={form.isFetching} onClick={async () => {
                            const updated = await form.refetch();
                            if (updated.isSuccess) setVersionChanged(false);
                        }}>
                            Open latest version
                        </Button>
                    )}
                </>}
                action={canSubmit ? {
                    run: sendAnswers,
                    label: submission ? "Resubmit for approval" : "Submit for approval",
                    pendingLabel: "Submitting…",
                    errorMessage: "Could not submit this form. Please try again.",
                } : undefined}
            />
        </div>
    );
}
