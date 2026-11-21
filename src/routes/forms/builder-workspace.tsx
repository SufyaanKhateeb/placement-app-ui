import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, Hash, ListChecks, Plus, Settings2, TextCursorInput, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fieldTypes } from "./api";
import type { FieldType, FormDefinition, FormField } from "./api";
import { RulesEditor } from "./validation-rules";

const presets = ["Name", "Email", "Group", "Subgroup"];

const fieldIcons = {
    text: TextCursorInput,
    boolean: ListChecks,
    integer: Hash,
    numeric: Hash,
    date: CalendarDays,
    timestamptz: CalendarDays,
};

type Props = {
    draft: FormDefinition;
    selectedID: string | null;
    disabled: boolean;
    onSelect: (id: string | null) => void;
    onDetails: (details: Pick<FormDefinition, "title" | "description">) => void;
    onAdd: (label: string, type: FieldType) => void;
    onUpdate: (id: string, patch: Partial<FormField>) => void;
    onMove: (index: number, direction: number) => void;
    onRemove: (id: string) => void;
};

export function BuilderWorkspace({ draft, selectedID, disabled, onSelect, onDetails, onAdd, onUpdate, onMove, onRemove }: Props) {
    const index = draft.fields.findIndex(field => field.id === selectedID);
    const selected = draft.fields[index];

    return (
        <div className="grid items-start overflow-hidden rounded-xl border bg-background lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-semibold">Fields</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {draft.fields.length} {draft.fields.length === 1 ? "field" : "fields"}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={disabled || draft.fields.length >= 100}>
                                <Plus className="mr-1.5 h-4 w-4" /> Add field <ChevronDown className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Field types</DropdownMenuLabel>
                            {fieldTypes.map(type => (
                                <DropdownMenuItem key={type.value} onSelect={() => onAdd("New field", type.value)}>
                                    {type.label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Common fields</DropdownMenuLabel>
                            {presets.map(preset => (
                                <DropdownMenuItem key={preset} onSelect={() => onAdd(preset, "text")}>{preset}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="p-3 sm:p-4">
                    <button type="button" disabled={disabled} aria-pressed={!selected} onClick={() => onSelect(null)}
                        className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            !selected && "bg-muted")}>
                        <Settings2 className="h-4 w-4 text-muted-foreground" /> Form details
                    </button>
                    {draft.fields.length === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed px-6 py-10 text-center">
                            <TextCursorInput className="mx-auto mb-3 h-5 w-5 text-muted-foreground" />
                            <p className="text-sm font-medium">No fields yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Add a field to start building your form.</p>
                        </div>
                    ) : (
                        <ul className="mt-2 space-y-1">
                            {draft.fields.map(field => {
                                const Icon = fieldIcons[field.type];
                                return (
                                    <li key={field.id}>
                                        <button type="button" disabled={disabled} aria-pressed={selectedID === field.id}
                                            onClick={() => onSelect(field.id)}
                                            className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                selectedID === field.id && "bg-muted")}>
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">{field.label || "Untitled field"}</span>
                                                <span className="block text-xs text-muted-foreground">{fieldTypes.find(type => type.value === field.type)?.label}</span>
                                            </span>
                                            {field.required && <span className="text-xs text-muted-foreground">Required</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
            <aside aria-label="Form settings" className="min-w-0 border-t bg-muted/25 lg:border-l lg:border-t-0">
                <div className="border-b px-5 py-4 sm:px-6">
                    <h2 className="font-semibold">{selected ? "Field settings" : "Form details"}</h2>
                </div>
                {selected ? (
                    <fieldset disabled={disabled} className="space-y-5 px-5 py-5 sm:px-6">
                        <legend className="sr-only">Selected field settings</legend>
                        <div className="space-y-2">
                            <Label htmlFor="selected-field-label">Field label</Label>
                            <Input id="selected-field-label" maxLength={120} value={selected.label}
                                onChange={event => onUpdate(selected.id, { label: event.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="selected-field-type">Field type</Label>
                            <select id="selected-field-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={selected.type}
                                onChange={event => onUpdate(selected.id, { type: event.target.value as FieldType, rules: undefined })}>
                                {fieldTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                            {selected.rules && <p className="text-xs text-muted-foreground">Changing the type clears these validation rules.</p>}
                        </div>
                        <label className="flex items-center justify-between gap-4 rounded-lg border bg-background px-3 py-3 text-sm font-medium">
                            Required answer
                            <input type="checkbox" checked={selected.required} className="h-4 w-4 accent-primary"
                                onChange={event => onUpdate(selected.id, { required: event.target.checked })} />
                        </label>
                        <RulesEditor key={selected.id + ":" + selected.type} field={selected}
                            onChange={rules => onUpdate(selected.id, { rules })} />
                        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                            <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Move field up">
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="outline" disabled={index === draft.fields.length - 1} onClick={() => onMove(index, 1)} aria-label="Move field down">
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive"
                                onClick={() => onRemove(selected.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove field
                            </Button>
                        </div>
                    </fieldset>
                ) : (
                    <fieldset disabled={disabled} className="space-y-5 px-5 py-5 sm:px-6">
                        <legend className="sr-only">Form details</legend>
                        <div className="space-y-2">
                            <Label htmlFor="form-title">Title</Label>
                            <Input id="form-title" maxLength={120} value={draft.title}
                                onChange={event => onDetails({ title: event.target.value, description: draft.description })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="form-description">Description</Label>
                            <textarea id="form-description" className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                maxLength={2000} value={draft.description}
                                onChange={event => onDetails({ title: draft.title, description: event.target.value })} />
                        </div>
                    </fieldset>
                )}
            </aside>
        </div>
    );
}