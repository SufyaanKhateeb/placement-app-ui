import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { axiosInstance } from "@/config/axios";
import { adminFormsPath, requestError } from "./api";
import type { FormDefinition, FormField } from "./api";

function previewValue(field: FormField, value: string) {
    if (value === "") return null;
    switch (field.type) {
        case "boolean":
            return value === "true";
        case "integer":
            return /^-?\d+$/.test(value) ? Number(value) : value;
        case "timestamptz": {
            const local = new Date(value);
            return Number.isNaN(local.valueOf()) ? value : local.toISOString();
        }
        default:
            return value;
    }
}

function validationHint(field: FormField) {
    const rules = field.rules;
    if (!rules) return "";
    const hints: string[] = [];
    if (rules.minLength !== undefined) hints.push("At least " + rules.minLength + " characters");
    if (rules.maxLength !== undefined) hints.push("At most " + rules.maxLength + " characters");
    const date = field.type === "date" || field.type === "timestamptz";
    const format = (value: string) => field.type === "timestamptz" ? new Date(value).toLocaleString() : value;
    if (rules.min) hints.push((date ? "From " : "Minimum ") + format(rules.min));
    if (rules.max) hints.push((date ? "Through " : "Maximum ") + format(rules.max));
    return hints.join(" · ");
}

export function FormPreview({ definition, allowValidation = false }: {
    definition: FormDefinition;
    allowValidation?: boolean;
}) {
    const previewID = useId();
    const [values, setValues] = useState<Record<string, string>>({});
    const validation = useMutation({
        mutationFn: async () => {
            const body = {
                draft: definition,
                values: Object.fromEntries(definition.fields.map(field => [field.id, previewValue(field, values[field.id] ?? "")])),
            };
            const response = await axiosInstance.post<{ valid: boolean; errors: Record<string, string> }>(adminFormsPath + "/preview", body);
            return response.data;
        },
    });
    const disabled = !allowValidation || validation.isPending;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!disabled) validation.mutate();
    }

    function setField(id: string, value: string) {
        setValues(previous => ({ ...previous, [id]: value }));
        validation.reset();
    }

    return (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
            <div>
                <h2 className="text-xl font-semibold">{definition.title || "Untitled form"}</h2>
                {definition.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{definition.description}</p>}
            </div>
            {definition.fields.length === 0 && <Empty><EmptyHeader><EmptyTitle>No fields yet</EmptyTitle></EmptyHeader></Empty>}
            {definition.fields.length > 0 && (
                <FieldGroup>
                    {definition.fields.map(field => {
                        const id = previewID + "-" + field.id;
                        const value = values[field.id] ?? "";
                        const error = validation.data?.errors[field.id];
                        const hint = validationHint(field);
                        const describedBy = [hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ") || undefined;
                        const inputType = { text: "text", boolean: "text", integer: "number", numeric: "text", date: "date", timestamptz: "datetime-local" }[field.type];
                        return (
                            <Field key={field.id} data-invalid={!!error} data-disabled={disabled}>
                                <FieldLabel htmlFor={id}>{field.label || "Untitled field"}{field.required && " (required)"}</FieldLabel>
                                {field.type === "boolean" ? (
                                    <Select value={value || "unanswered"} disabled={disabled} required={field.required}
                                        onValueChange={answer => setField(field.id, answer === "unanswered" ? "" : answer)}>
                                        <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={describedBy}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="unanswered">Select an answer</SelectItem>
                                                <SelectItem value="true">Yes</SelectItem>
                                                <SelectItem value="false">No</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input id={id} type={inputType} step={field.type === "integer" ? 1 : undefined}
                                        inputMode={field.type === "numeric" ? "decimal" : undefined}
                                        value={value} disabled={disabled} required={field.required} aria-invalid={!!error}
                                        aria-describedby={describedBy}
                                        onChange={event => setField(field.id, event.target.value)} />
                                )}
                                {hint && <FieldDescription id={id + "-hint"}>{hint}</FieldDescription>}
                                {error && <FieldError id={id + "-error"}>{error}</FieldError>}
                            </Field>
                        );
                    })}
                </FieldGroup>
            )}
            {allowValidation && definition.fields.length > 0 && (
                <Button type="submit" variant="outline" className="w-fit gap-2" disabled={disabled}>
                    {validation.isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
                    {validation.isPending ? "Checking…" : "Check sample answers"}
                </Button>
            )}
            {validation.data?.valid && <p role="status" className="text-sm">Sample answers are valid.</p>}
            {validation.isError && (
                <Alert variant="destructive"><AlertDescription>{requestError(validation.error, "Could not check sample answers.")}</AlertDescription></Alert>
            )}
        </form>
    );
}