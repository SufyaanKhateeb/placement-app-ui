import { Button } from "@/components/ui/button";
import type { FormField, ReviewCommentPart } from "./api";

export function ReviewFeedback({ comment, fields, fieldTarget, legacy }: {
    comment?: ReviewCommentPart[];
    fields: FormField[];
    fieldTarget: (id: string) => string;
    legacy?: Record<string, string>;
}) {
    if (!comment?.length && !legacy) return null;

    function mention(fieldId: string) {
        const field = fields.find(item => item.id === fieldId);
        return (
            <Button variant="link" type="button" className="inline h-auto max-w-full whitespace-normal p-0 align-baseline"
                onClick={() => focusReviewField(fieldTarget(fieldId))}>
                @{field?.label ?? fieldId}
            </Button>
        );
    }

    return (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-4" aria-label="Review feedback">
            <h3 className="text-sm font-semibold">Review feedback</h3>
            {comment?.length ? (
                <p className="whitespace-pre-wrap break-words text-sm">
                    {comment.map((part, index) => <span key={index}>{"fieldId" in part ? mention(part.fieldId) : part.text}</span>)}
                </p>
            ) : (
                <ul className="flex flex-col gap-2 text-sm">
                    {Object.entries(legacy ?? {}).map(([fieldId, text]) => (
                        <li key={fieldId} className="whitespace-pre-wrap break-words">{mention(fieldId)}{" "}{text}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function focusReviewField(id: string) {
    const field = document.getElementById(id);
    field?.focus({ preventScroll: true });
    field?.scrollIntoView({ block: "center" });
}
