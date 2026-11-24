import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import type { FieldRules, FieldType, FormField } from "./api";

const lengths = [
    { key: "minLength", label: "Minimum length" },
    { key: "maxLength", label: "Maximum length" },
] as const;

function fromLocalDateTime(value: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toISOString();
}

function toLocalDateTime(value: string | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function RulesEditor({ field, disabled, onChange }: { field: FormField; disabled: boolean; onChange: (rules: FieldRules | undefined) => void }) {
    if (field.type === "boolean") return null;
    const rules = field.rules ?? {};

    function setRule<K extends keyof FieldRules>(key: K, value: FieldRules[K]) {
        const next = { ...rules, [key]: value };
        onChange(Object.values(next).some(item => item !== undefined && item !== "") ? next : undefined);
    }

    return (
        <FieldSet disabled={disabled} className="gap-3">
            <FieldLegend variant="label">Validation</FieldLegend>
            <FieldDescription>Leave a limit blank to allow any valid value.</FieldDescription>
            <FieldGroup className="gap-4">
                {field.type === "text" ? (
                    <>
                        <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            {lengths.map(({ key, label }) => (
                                <Field key={key} data-disabled={disabled}>
                                    <FieldLabel htmlFor={"rule-" + key}>{label}</FieldLabel>
                                    <Input id={"rule-" + key} type="number" disabled={disabled} min={0} max={4000} step={1}
                                        value={rules[key] ?? ""} placeholder="No limit"
                                        onChange={event => setRule(key, event.target.value ? Number(event.target.value) : undefined)} />
                                </Field>
                            ))}
                        </FieldGroup>
                        <Field data-disabled={disabled}>
                            <FieldLabel htmlFor="rule-pattern">Regex pattern</FieldLabel>
                            <Input id="rule-pattern" disabled={disabled} maxLength={256} value={rules.pattern ?? ""}
                                placeholder="^[A-Z]{3}-[0-9]{3}$"
                                aria-describedby="rule-pattern-help"
                                onChange={event => setRule("pattern", event.target.value || undefined)} />
                            <FieldDescription id="rule-pattern-help">Use Go regex syntax. Add ^ and $ to match the whole answer.</FieldDescription>
                        </Field>
                    </>
                ) : (
                    <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <RangeInput name="min" fieldType={field.type} disabled={disabled} value={rules.min} onChange={value => setRule("min", value)} />
                        <RangeInput name="max" fieldType={field.type} disabled={disabled} value={rules.max} onChange={value => setRule("max", value)} />
                    </FieldGroup>
                )}
            </FieldGroup>
            {field.type === "timestamptz" && <FieldDescription>Date and time limits use your local time zone.</FieldDescription>}
        </FieldSet>
    );
}

function RangeInput({ name, fieldType, disabled, value, onChange }: {
    name: "min" | "max";
    fieldType: FieldType;
    disabled: boolean;
    value?: string;
    onChange: (value: string | undefined) => void;
}) {
    const time = fieldType === "timestamptz";
    const date = fieldType === "date";
    const isMinimum = name === "min";
    const label = date || time
        ? (isMinimum ? "Earliest value" : "Latest value")
        : (isMinimum ? "Minimum value" : "Maximum value");

    return (
        <Field className="min-w-0" data-disabled={disabled}>
            <FieldLabel htmlFor={"rule-" + name}>{label}</FieldLabel>
            <Input id={"rule-" + name} disabled={disabled} type={time ? "datetime-local" : date ? "date" : "text"}
                inputMode={fieldType === "numeric" ? "decimal" : fieldType === "integer" ? "numeric" : undefined}
                value={time ? toLocalDateTime(value) : value ?? ""} placeholder="No limit" maxLength={100}
                onChange={event => onChange(time ? fromLocalDateTime(event.target.value) : event.target.value || undefined)} />
        </Field>
    );
}