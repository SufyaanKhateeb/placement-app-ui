import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { FormField } from "./api";
import { fieldMentions, partialMention, type Mention } from "./review-comment";

export function ReviewCommentEditor({ fields, value, onChange, disabled }: {
    fields: FormField[];
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) {
    const input = useRef<HTMLTextAreaElement>(null);
    const id = useId();
    const [caret, setCaret] = useState(0);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const match = open && !disabled ? value.slice(0, caret).match(partialMention) : null;
    const matches = match ? fieldMentions(fields).filter(mention => mention.alias.includes(match[1].toLowerCase())).slice(0, 8) : [];

    function insert(mention: Mention) {
        if (!match || match.index === undefined) return;
        const after = value.slice(caret).replace(/^[\p{L}\p{N}_-]+/u, "");
        const inserted = "@" + mention.alias + " ";
        const next = value.slice(0, match.index) + inserted + after;
        if (next.length > 4000) return;
        const position = match.index + inserted.length;
        onChange(next);
        setOpen(false);
        requestAnimationFrame(() => {
            input.current?.focus();
            input.current?.setSelectionRange(position, position);
        });
    }

    return (
        <Field>
            <FieldLabel htmlFor={id}>Review comment</FieldLabel>
            <FieldDescription id={id + "-help"}>Type @ to mention a field. Use the arrow keys and Enter to pick a match.</FieldDescription>
            <Textarea id={id} ref={input} rows={4} maxLength={4000} disabled={disabled} value={value}
                aria-describedby={id + "-help"}
                aria-controls={matches.length ? id + "-matches" : undefined}
                onChange={event => {
                    onChange(event.target.value);
                    setCaret(event.target.selectionStart);
                    setActive(0);
                    setOpen(true);
                }}
                onSelect={event => {
                    setCaret(event.currentTarget.selectionStart);
                    setActive(0);
                }}
                onKeyDown={event => {
                    if (!matches.length) return;
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        const direction = event.key === "ArrowDown" ? 1 : -1;
                        setActive(index => (index + direction + matches.length) % matches.length);
                    } else if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        insert(matches[active] ?? matches[0]);
                    } else if (event.key === "Escape") {
                        event.preventDefault();
                        setOpen(false);
                    }
                }} />
            {matches.length > 0 && (
                <div id={id + "-matches"} role="group" aria-label="Field mentions" className="grid gap-1 rounded-md border bg-popover p-1">
                    <span role="status" className="sr-only">{matches[active]?.field.label ?? matches[0].field.label}</span>
                    {matches.map((mention, index) => (
                        <Button key={mention.field.id} size="sm" variant={index === active ? "secondary" : "ghost"} type="button"
                            className="justify-between gap-3" onClick={() => insert(mention)}>
                            <span className="truncate">{mention.field.label}</span>
                            <span className="truncate text-xs text-muted-foreground">@{mention.alias}</span>
                        </Button>
                    ))}
                </div>
            )}
        </Field>
    );
}
