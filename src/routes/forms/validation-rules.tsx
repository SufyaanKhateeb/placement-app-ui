import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function RulesEditor({ field, onChange }: { field: FormField; onChange: (rules: FieldRules | undefined) => void }) {
    if (field.type === "boolean") return null;
    const rules = field.rules ?? {};

    function setRule<K extends keyof FieldRules>(key: K, value: FieldRules[K]) {
        const next = { ...rules, [key]: value };
        onChange(Object.values(next).some(item => item !== undefined && item !== "") ? next : undefined);
    }

    return (
        <div className="space-y-4 border-t pt-4">
            <div>
                <h3 className="text-sm font-semibold">Validation</h3>
                <p className="mt-1 text-xs text-muted-foreground">Leave a limit blank to allow any valid value.</p>
            </div>
            {field.type === "text" ? (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        {lengths.map(({ key, label }) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={"rule-" + key}>{label}</Label>
                                <Input id={"rule-" + key} type="number" min={0} max={4000} step={1}
                                    value={rules[key] ?? ""} placeholder="No limit"
                                    onChange={event => setRule(key, event.target.value ? Number(event.target.value) : undefined)} />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-pattern">Regex pattern</Label>
                        <Input id="rule-pattern" className="font-mono" maxLength={256} value={rules.pattern ?? ""}
                            placeholder="^[A-Z]{3}-[0-9]{3}$"
                            aria-describedby="rule-pattern-help"
                            onChange={event => setRule("pattern", event.target.value || undefined)} />
                        <p id="rule-pattern-help" className="text-xs text-muted-foreground">Use Go regex syntax. Add ^ and $ to match the whole answer.</p>
                    </div>
                </>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <RangeInput name="min" fieldType={field.type} value={rules.min} onChange={value => setRule("min", value)} />
                    <RangeInput name="max" fieldType={field.type} value={rules.max} onChange={value => setRule("max", value)} />
                </div>
            )}
            {field.type === "timestamptz" && <p className="text-xs text-muted-foreground">Date and time limits use your local time zone.</p>}
        </div>
    );
}

function RangeInput({ name, fieldType, value, onChange }: {
    name: "min" | "max";
    fieldType: FieldType;
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
        <div className="min-w-0 space-y-2">
            <Label htmlFor={"rule-" + name}>{label}</Label>
            <Input id={"rule-" + name} type={time ? "datetime-local" : date ? "date" : "text"}
                inputMode={fieldType === "numeric" ? "decimal" : fieldType === "integer" ? "numeric" : undefined}
                value={time ? toLocalDateTime(value) : value ?? ""} placeholder="No limit" maxLength={100}
                onChange={event => onChange(time ? fromLocalDateTime(event.target.value) : event.target.value || undefined)} />
        </div>
    );
}