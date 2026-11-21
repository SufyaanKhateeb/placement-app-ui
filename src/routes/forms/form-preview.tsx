import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/config/axios";
import { adminFormsPath, requestError } from "./api";
import type { FormDefinition, FormField } from "./api";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

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
        <form noValidate onSubmit={submit} className="space-y-5">
            <div>
                <h2 className="text-xl font-semibold">{definition.title || "Untitled form"}</h2>
                {definition.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{definition.description}</p>}
            </div>
            {definition.fields.length === 0 && <p className="text-sm text-muted-foreground">No fields yet.</p>}
            {definition.fields.map(field => {
                const id = previewID + "-" + field.id;
                const value = values[field.id] ?? "";
                const error = validation.data?.errors[field.id];
                const inputType = { text: "text", boolean: "text", integer: "number", numeric: "text", date: "date", timestamptz: "datetime-local" }[field.type];
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={id}>{field.label || "Untitled field"}{field.required && " (required)"}</Label>
                        {field.type === "boolean" ? (
                            <select id={id} className={selectClass} value={value} disabled={disabled}
                                aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined}
                                onChange={event => setField(field.id, event.target.value)}>
                                <option value="">Select an answer</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        ) : (
                            <Input id={id} type={inputType} step={field.type === "integer" ? 1 : undefined}
                                inputMode={field.type === "numeric" ? "decimal" : undefined}
                                value={value} disabled={disabled} aria-invalid={!!error}
                                aria-describedby={error ? id + "-error" : undefined}
                                onChange={event => setField(field.id, event.target.value)} />
                        )}
                        {error && <p id={id + "-error"} className="text-sm text-destructive">{error}</p>}
                    </div>
                );
            })}
            {allowValidation && definition.fields.length > 0 && (
                <Button type="submit" variant="outline" disabled={disabled}>{validation.isPending ? "Checking…" : "Check sample answers"}</Button>
            )}
            {validation.data?.valid && <p role="status" className="text-sm">Sample answers are valid.</p>}
            {validation.isError && (
                <Alert variant="destructive"><AlertDescription>{requestError(validation.error, "Could not check sample answers.")}</AlertDescription></Alert>
            )}
        </form>
    );
}