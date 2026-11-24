import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { axiosInstance } from "@/config/axios";
import { publishedFormsPath, requestError } from "./api";
import type { FormSummary, PublishedForm } from "./api";
import { FormPreview } from "./form-preview";

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
    const { id } = useParams();
    const form = useQuery({
        queryKey: ["publishedForms", id],
        queryFn: async () => (await axiosInstance.get<PublishedForm>(publishedFormsPath + "/" + id)).data,
        retry: false,
    });

    return (
        <section className="workspace-page max-w-3xl">
            <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
                <Link to="/forms"><ArrowLeft data-icon="inline-start" aria-hidden="true" /> All forms</Link>
            </Button>
            {form.isPending && <p role="status" className="text-sm text-muted-foreground">Loading form…</p>}
            {form.isError && <Alert variant="destructive"><AlertDescription>{requestError(form.error, "Could not load form.")}</AlertDescription></Alert>}
            {form.data && (
                <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-7">
                    <FormPreview definition={form.data.definition} />
                    <p className="text-sm text-muted-foreground">Submissions are not available yet.</p>
                </div>
            )}
        </section>
    );
}
