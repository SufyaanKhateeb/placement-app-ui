import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PermissionGuard } from "@/auth/permission-guard";
import { permissions } from "@/auth/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ReviewCommentEditor } from "./review-comment-editor";
import { parseReviewComment } from "./review-comment";
import { ReviewFeedback } from "./review-feedback";
import { api, isApiError } from "@/config/api";
import { requestError } from "./api";
import type { FormAnswer, FormSubmission } from "./api";
import { SubmissionStatusBadge } from "./submission-status";

import { DirectoryItems, DirectoryNoResults, DirectoryToolbar } from "./directory";
import { initialDirectoryControls, reviewStatuses } from "./directory-controls";

const submissionsPath = "/admin/submissions";
const submissionQueueKey = ["adminSubmissions", "list"] as const;


type Submitter = { userName: string; userEmail: string };
type Review = FormSubmission & Submitter & { approvalRoleAvailable?: boolean };
type ReviewItem = Pick<Review, "id" | "status" | "version" | "submittedAt"> & Submitter & { formTitle: string };
type Decision = "approved" | "changes_requested";

export function AdminSubmissionsPage() {
    return <PermissionGuard permission={permissions.reviewSubmissions}><SubmissionQueue /></PermissionGuard>;
}

function SubmissionQueue() {
    const [controls, setControls] = useState(initialDirectoryControls);
    const query = controls.query.trim();
    const [appliedQuery, setAppliedQuery] = useState(query);
    useEffect(() => {
        const timeout = window.setTimeout(() => setAppliedQuery(query), 200);
        return () => window.clearTimeout(timeout);
    }, [query]);

    const search = query ? appliedQuery : "";
    const waitingForSearch = query !== search;
    const status = controls.status === "all" ? undefined : controls.status;
    const queue = useInfiniteQuery({
        queryKey: [...submissionQueueKey, search, status],
        initialPageParam: undefined as number | undefined,
        queryFn: async ({ pageParam, signal }) => (await api.get<{ items: ReviewItem[]; nextBefore?: number }>(
            submissionsPath, { params: { before: pageParam, q: search || undefined, status }, signal },
        )).data,
        getNextPageParam: page => page.nextBefore,
        retry: false,
    });
    const items = waitingForSearch ? [] : queue.data?.pages.flatMap(page => page.items) ?? [];
    const pending = waitingForSearch || queue.isPending;
    const hasFilters = query !== "" || status !== undefined;
    const count = items.length + (items.length === 1 ? " submission" : " submissions");

    return (
        <section className="workspace-directory">
            <header className="directory-heading"><h1>Submissions</h1></header>
            <DirectoryToolbar controls={controls} onChange={setControls} options={reviewStatuses} searchLabel="Search submissions"
                count={!pending && queue.data ? count + (queue.hasNextPage ? " loaded" : "") : undefined} />
            <div className="directory-content">
                {pending && <p role="status" className="text-sm text-muted-foreground">{hasFilters ? "Searching submissions…" : "Loading submissions…"}</p>}
                {!pending && queue.isError && <Alert variant="destructive"><AlertDescription>
                    {queue.isFetchNextPageError ? "Could not load more submissions." : "Could not load submissions."}
                </AlertDescription></Alert>}
                {!pending && queue.isSuccess && items.length === 0 && (hasFilters
                    ? <DirectoryNoResults onReset={() => setControls({ ...controls, query: "", status: "all" })} />
                    : <Empty><EmptyHeader><EmptyTitle>No submissions yet</EmptyTitle></EmptyHeader></Empty>)}
                {items.length > 0 && <DirectoryItems view={controls.view} items={items.map(item => ({
                    href: submissionsPath + "/" + item.id,
                    title: item.formTitle,
                    subtitle: item.userName || item.userEmail,
                    status: <SubmissionStatusBadge status={item.status} quiet />,
                    version: item.version,
                    action: item.status === "submitted" ? "Review" : "View",
                }))} />}
                {!pending && queue.hasNextPage && (
                    <Button type="button" size="sm" variant="outline" className="w-fit" disabled={queue.isFetchingNextPage}
                        onClick={() => void queue.fetchNextPage()}>
                        {queue.isFetchingNextPage ? "Loading…" : hasFilters ? "Load more results" : "Load older submissions"}
                    </Button>
                )}
            </div>
        </section>
    );
}

export function AdminSubmissionPage() {
    const { id = "" } = useParams();
    return <PermissionGuard permission={permissions.reviewSubmissions}><SubmissionDetail key={id} id={id} /></PermissionGuard>;
}

function SubmissionDetail({ id }: { id: string }) {
    const query = useQuery({
        queryKey: ["adminSubmissions", id],
        queryFn: async () => (await api.get<Review>(submissionsPath + "/" + id)).data,
        retry: false,
        refetchOnWindowFocus: false,
    });
    return (
        <section className="submission-detail">
            <nav className="detail-breadcrumb" aria-label="Breadcrumb">
                <Link to={submissionsPath}>Submissions</Link>
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <span aria-current="page">Submission #{id}</span>
            </nav>
            {query.isPending && <p role="status" className="mx-5 my-4 text-sm text-muted-foreground">Loading submission…</p>}
            {query.isError && <Alert variant="destructive" className="mx-5 my-4 w-auto"><AlertDescription>{requestError(query.error, "Could not load the submission.")}</AlertDescription></Alert>}
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
        mutationFn: async (action: Decision) => (await api.patch<Review>(submissionsPath + "/" + review.id, {
            revision: review.revision,
            decision: action,
            comment: action === "changes_requested" ? comment : undefined,
        })).data,
        onSuccess: result => {
            void queryClient.invalidateQueries({ queryKey: submissionQueueKey });
            queryClient.setQueryData(["adminSubmissions", String(review.id)], result);
        },
    });
    const stale = isApiError(decision.error) && decision.error.response?.status === 409;

    return (
        <>
            <header className="submission-heading">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">{review.definition.title}</h1>
                    <SubmissionStatusBadge status={review.status} quiet />
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                    {review.userName && <><span className="font-medium text-foreground">{review.userName}</span><span aria-hidden="true"> · </span></>}
                    {review.userEmail}
                </p>
            </header>
            <div className="submission-body">
                <section className="submission-answers" aria-labelledby="submission-answers-heading">
                    <h2 className="text-sm font-semibold" id="submission-answers-heading">Submitted answers</h2>
                    <dl className="mt-3 divide-y border-y">
                        {review.definition.fields.map(field => (
                            <div key={field.id} id={"review-field-" + field.id} tabIndex={-1} className="submission-answer">
                                <dt className="break-words text-sm text-muted-foreground">{field.label}</dt>
                                <dd className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium">{answerLabel(review.values[field.id])}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
                <section className="submission-review" aria-labelledby="submission-review-heading">
                    <header>
                        <h2 id="submission-review-heading" className="text-sm font-semibold">Review</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Form version {review.version}</p>
                    </header>
                    <ReviewFeedback comment={review.comment} legacy={review.changes} fields={review.definition.fields}
                        fieldTarget={id => "review-field-" + id} />
                    {reviewing && <ReviewCommentEditor fields={review.definition.fields} value={draft} onChange={setDraft} disabled={decision.isPending || stale} />}
                    {decision.isError && (
                        <Alert variant="destructive">
                            <AlertDescription>{requestError(decision.error, "Could not save the review.")}</AlertDescription>
                        </Alert>
                    )}
                    {reviewing && (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {stale ? (
                                    <Button size="sm" variant="outline" onClick={onReload}>Load latest submission</Button>
                                ) : (
                                    <>
                                        <Button size="sm" disabled={decision.isPending || draft.trim().length > 0}
                                            onClick={() => decision.mutate("approved")}>Approve</Button>
                                        <Button size="sm" variant="outline" disabled={decision.isPending || !hasMention || !hasInstructions}
                                            onClick={() => decision.mutate("changes_requested")}>Request changes</Button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Approval records verification.
                                {action?.kind === "follow_up_form" && " It also unlocks the configured follow-up form."}
                                {action?.kind === "assign_role" && (review.approvalRoleAvailable
                                    ? " It also assigns the configured application role."
                                    : " The configured role is unavailable. This approval will record verification only.")}
                            </p>
                        </>
                    )}
                    {!reviewing && review.status === "approved" && review.approvalRoleAvailable === false && (
                        <p role="status" className="text-sm text-muted-foreground">Approval recorded verification only. The configured role was unavailable.</p>
                    )}
                </section>
            </div>
        </>
    );
}
