import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup } from "@/components/ui/field";
import { ReviewCommentEditor } from "./review-comment-editor";
import { parseReviewComment } from "./review-comment";
import { ReviewFeedback } from "./review-feedback";
import { axiosInstance } from "@/config/axios";
import { requestError } from "./api";
import type { FormAnswer, FormSubmission } from "./api";
import { AdminFormsGuard } from "./admin-forms";
import { SubmissionStatusBadge } from "./submission-status";

const submissionsPath = "/admin/submissions";


type Submitter = { userName: string; userEmail: string };
type Review = FormSubmission & Submitter;
type ReviewItem = Pick<Review, "id" | "status" | "version" | "submittedAt"> & Submitter & { formTitle: string };
type Decision = "approved" | "changes_requested";

export function AdminSubmissionsPage() {
    return <AdminFormsGuard><SubmissionQueue /></AdminFormsGuard>;
}

function SubmissionQueue() {
    const queue = useInfiniteQuery({
        queryKey: ["adminSubmissions"],
        initialPageParam: undefined as number | undefined,
        queryFn: async ({ pageParam }) => (await axiosInstance.get<{ items: ReviewItem[]; nextBefore?: number }>(
            submissionsPath, { params: { before: pageParam } },
        )).data,
        getNextPageParam: page => page.nextBefore,
        retry: false,
    });
    const items = queue.data?.pages.flatMap(page => page.items) ?? [];

    return (
        <section className="workspace-list-page">
            <div className="workspace-page-heading"><h1>Submissions</h1></div>
            {queue.isPending && <p role="status" className="p-4 text-sm text-muted-foreground">Loading submissions…</p>}
            {queue.isError && <Alert variant="destructive"><AlertDescription>Could not load submissions.</AlertDescription></Alert>}
            {queue.isSuccess && items.length === 0 && (
                <Empty><EmptyHeader><EmptyTitle>No submissions yet</EmptyTitle></EmptyHeader></Empty>
            )}
            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        <Link className="workspace-list-row" to={submissionsPath + "/" + item.id}>
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">{item.formTitle}</span>
                                <span className="truncate text-xs text-muted-foreground">{item.userName || item.userEmail} · v{item.version}</span>
                            </span>
                            <SubmissionStatusBadge status={item.status} />
                        </Link>
                    </li>
                ))}
            </ul>
            {queue.hasNextPage && (
                <Button variant="outline" className="m-4 w-fit" disabled={queue.isFetchingNextPage} onClick={() => void queue.fetchNextPage()}>
                    {queue.isFetchingNextPage ? "Loading…" : "Load older submissions"}
                </Button>
            )}
        </section>
    );
}

export function AdminSubmissionPage() {
    const { id = "" } = useParams();
    return <AdminFormsGuard><SubmissionDetail key={id} id={id} /></AdminFormsGuard>;
}

function SubmissionDetail({ id }: { id: string }) {
    const query = useQuery({
        queryKey: ["adminSubmissions", id],
        queryFn: async () => (await axiosInstance.get<Review>(submissionsPath + "/" + id)).data,
        retry: false,
        refetchOnWindowFocus: false,
    });
    return (
        <section className="workspace-page max-w-3xl">
            <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
                <Link to={submissionsPath}><ArrowLeft data-icon="inline-start" aria-hidden="true" /> All submissions</Link>
            </Button>
            {query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading submission…</p>}
            {query.isError && <Alert variant="destructive"><AlertDescription>{requestError(query.error, "Could not load the submission.")}</AlertDescription></Alert>}
            {query.data && <ReviewForm key={query.data.revision} review={query.data} onReload={() => void query.refetch()} />}
        </section>
    );
}

function answerLabel(value: FormAnswer | undefined) {
    if (value === null || value === undefined || value === "") return "No answer";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
}

function ReviewForm({ review, onReload }: { review: Review; onReload: () => void }) {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState("");
    const comment = parseReviewComment(draft.trim(), review.definition.fields);
    const hasMention = comment.some(part => "fieldId" in part);
    const hasInstructions = comment.some(part => "text" in part && part.text.trim());
    const reviewing = review.status === "submitted";
    const action = review.definition.approvalAction;
    const decision = useMutation({
        mutationFn: async (action: Decision) => (await axiosInstance.put<Review>(submissionsPath + "/" + review.id + "/review", {
            revision: review.revision,
            decision: action,
            comment: action === "changes_requested" ? comment : undefined,
        })).data,
        onSuccess: result => {
            void queryClient.invalidateQueries({ queryKey: ["adminSubmissions"], exact: true });
            queryClient.setQueryData(["adminSubmissions", String(review.id)], result);
        },
    });
    const stale = isAxiosError(decision.error) && decision.error.response?.status === 409;

    return (
        <>
            <div className="workspace-page-heading">
                <div>
                    <h1>{review.definition.title}</h1>
                    <p>{review.userName} · {review.userEmail} · Form version {review.version}</p>
                </div>
                <SubmissionStatusBadge status={review.status} />
            </div>
            {reviewing && (
                <p className="text-sm text-muted-foreground">
                    Approval records verification.
                    {action?.kind === "follow_up_form" && " It also unlocks the configured follow-up form."}
                    {action?.kind === "assign_role" && " It also assigns the application role " + action.role + "."}
                </p>
            )}
            <FieldGroup>
                {review.definition.fields.map(field => (
                    <Field key={field.id} id={"review-field-" + field.id} tabIndex={-1} className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-medium">{field.label}</h2>
                        <p className="whitespace-pre-wrap break-words text-sm">{answerLabel(review.values[field.id])}</p>
                    </Field>
                ))}
            </FieldGroup>
            <ReviewFeedback comment={review.comment} legacy={review.changes} fields={review.definition.fields}
                fieldTarget={id => "review-field-" + id} />
            {reviewing && <ReviewCommentEditor fields={review.definition.fields} value={draft} onChange={setDraft} disabled={decision.isPending || stale} />}
            {decision.isError && (
                <Alert variant="destructive">
                    <AlertDescription>{requestError(decision.error, "Could not save the review.")}</AlertDescription>
                </Alert>
            )}
            {reviewing && (
                <div className="flex flex-wrap gap-2">
                    {stale ? (
                        <Button variant="outline" onClick={onReload}>Load latest submission</Button>
                    ) : (
                        <>
                            <Button disabled={decision.isPending || draft.trim().length > 0}
                                onClick={() => decision.mutate("approved")}>Approve</Button>
                            <Button variant="outline" disabled={decision.isPending || !hasMention || !hasInstructions}
                                onClick={() => decision.mutate("changes_requested")}>Request changes</Button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
