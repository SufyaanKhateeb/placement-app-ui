import { isAxiosError } from "axios";
import { useState } from "react";
import { useGetUserQuery } from "@/auth/queryHooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { axiosInstance } from "@/config/axios";
import { publishedFormsPath, requestError } from "./api";
import type { FormAnswerErrors, FormAnswers, FormSubmission, FormSummary, PublishedForm } from "./api";
import { AnswerForm } from "./form-preview";

export function PublishedFormsPage() {
    const forms = useQuery({
        queryKey: ["publishedForms"],
        queryFn: async () => (await axiosInstance.get<FormSummary[]>(publishedFormsPath)).data,
        retry: false,
    });

    return (
        <section className="workspace-list-page">
            <div className="workspace-page-heading">
                <div>
                    <h1>Forms</h1>
                </div>
            </div>
            <div className="workspace-list-toolbar">
                <span className="font-medium text-foreground">Published forms</span>
                {forms.data && <span className="tabular-nums">{forms.data.length}</span>}
            </div>
            {forms.isPending && <p role="status" className="p-4 text-sm text-muted-foreground">Loading forms…</p>}
            {forms.isError && <Alert variant="destructive"><AlertDescription>Could not load forms.</AlertDescription></Alert>}
            {forms.data?.length === 0 && (
                <Empty className="mx-auto mt-14 max-w-sm">
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
                        <EmptyTitle>No forms have been published</EmptyTitle>
                    </EmptyHeader>
                </Empty>
            )}
            {!!forms.data?.length && (
                <ul>
                    {forms.data.map(form => (
                        <li key={form.id}>
                            <Link className="workspace-list-row" to={publishedFormsPath + "/" + form.id}>
                                <span className="flex min-w-0 items-center gap-3">
                                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    <span className="truncate font-medium">{form.title}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Badge variant="outline">Version {form.publishedVersion}</Badge>
                                    <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function PublishedFormPage() {
    const { id = "" } = useParams();

    return (
        <section className="workspace-page max-w-3xl">
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
    const submissionPath = path + "/submission";
    const isUser = user?.role === "user";
    const submissionKey = ["publishedForms", id, "submission", user?.id];
    const form = useQuery({
        queryKey: ["publishedForms", id],
        queryFn: async () => (await axiosInstance.get<PublishedForm>(path)).data,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const receipt = useQuery({
        queryKey: submissionKey,
        queryFn: async () => (await axiosInstance.get<FormSubmission | null>(submissionPath)).data,
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
    const version = submission?.version ?? form.data.version;
    const canSubmit = isUser && (!submission || submission.status === "changes_requested");
    const revision = submission?.revision;

    async function sendAnswers(values: FormAnswers) {
        try {
            const body = { version, values, ...(revision === undefined ? {} : { revision }) };
            const response = revision === undefined
                ? await axiosInstance.post<FormSubmission>(submissionPath, body)
                : await axiosInstance.put<FormSubmission>(submissionPath, body);
            queryClient.setQueryData(submissionKey, response.data);
        } catch (error) {
            if (isAxiosError<FormAnswerErrors>(error) && error.response?.status === 409) {
                if (error.response.data.code === "version_changed") setVersionChanged(true);
                await receipt.refetch();
            }
            throw error;
        }
    }

    return (
        <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-7">
            {submission && (
                <Alert>
                    <AlertDescription role="status">
                        {submission.status === "changes_requested" ? "Changes requested. Update your answers and resubmit." :
                            submission.status === "approved" ? "Approved." : "Submitted for approval."}
                        {" "}Form version {submission.version}.
                    </AlertDescription>
                </Alert>
            )}
            {versionChanged && !submission && (
                <Button type="button" variant="outline" className="w-fit" disabled={form.isFetching} onClick={async () => {
                    const updated = await form.refetch();
                    if (updated.isSuccess) setVersionChanged(false);
                }}>
                    Open latest version
                </Button>
            )}
            <AnswerForm
                key={version + ":" + (revision ?? "new") + ":" + (submission?.status ?? "")}
                definition={submission?.definition ?? form.data.definition}
                initialValues={submission?.values}
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
