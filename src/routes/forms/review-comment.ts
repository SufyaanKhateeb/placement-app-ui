import type { FormField, ReviewCommentPart } from "./api";

export type Mention = { alias: string; field: FormField };
const mentionPattern = /(?<![\p{L}\p{N}._%+@-])@([\p{L}\p{N}_-]+)/gu;
export const partialMention = /(?<![\p{L}\p{N}._%+@-])@([\p{L}\p{N}_-]*)$/u;

export function fieldMentions(fields: FormField[]): Mention[] {
    const used = new Set<string>();
    return fields.map(field => {
        const base = field.label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "") || "field";
        let alias = base;
        let suffix = 2;
        while (used.has(alias)) alias = base + "_" + suffix++;
        used.add(alias);
        return { alias, field };
    });
}

export function parseReviewComment(value: string, fields: FormField[]): ReviewCommentPart[] {
    const aliases = new Map(fieldMentions(fields).map(({ alias, field }) => [alias, field.id]));
    const parts: ReviewCommentPart[] = [];
    let start = 0;
    for (const match of value.matchAll(mentionPattern)) {
        const id = aliases.get(match[1].toLowerCase());
        if (!id) continue;
        if (match.index > start) parts.push({ text: value.slice(start, match.index) });
        parts.push({ fieldId: id });
        start = match.index + match[0].length;
    }
    if (start < value.length) parts.push({ text: value.slice(start) });
    return parts;
}
