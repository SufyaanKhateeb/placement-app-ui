import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, Hash, ListChecks, Plus, Settings2, TextCursorInput, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fieldTypes } from "./api";
import type { FieldType, FormDefinition, FormField } from "./api";
import { ApprovalSettingsEditor } from "./approval-settings";
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
    formID: number;
    selectedID: string | null;
    disabled: boolean;
    onSelect: (id: string | null) => void;
    onDetails: (details: Partial<Pick<FormDefinition, "title" | "description" | "approvalAction" | "requiresApprovalGrant">>) => void;
    onAdd: (label: string, type: FieldType) => void;
    onUpdate: (id: string, patch: Partial<FormField>) => void;
    onMove: (index: number, direction: number) => void;
    onRemove: (id: string) => void;
};

export function BuilderWorkspace({ draft, formID, selectedID, disabled, onSelect, onDetails, onAdd, onUpdate, onMove, onRemove }: Props) {
    const index = draft.fields.findIndex(field => field.id === selectedID);
    const selected = draft.fields[index];

    return (
        <div className="builder-layout">
            <div className="min-w-0">
                <div className="builder-heading">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-sm font-semibold">Fields</h2>
                        <span className="text-xs tabular-nums text-muted-foreground">{draft.fields.length}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2" disabled={disabled || draft.fields.length >= 100}>
                                <Plus data-icon="inline-start" /> Add field <ChevronDown data-icon="inline-end" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Field types</DropdownMenuLabel>
                                {fieldTypes.map(type => (
                                    <DropdownMenuItem key={type.value} onSelect={() => onAdd("New field", type.value)}>
                                        {type.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Common fields</DropdownMenuLabel>
                                {presets.map(preset => (
                                    <DropdownMenuItem key={preset} onSelect={() => onAdd(preset, "text")}>{preset}</DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="px-3 py-2 sm:px-5">
                    <button type="button" disabled={disabled} aria-pressed={!selected} onClick={() => onSelect(null)}
                        className="builder-field-row text-sm font-medium">
                        <Settings2 className="h-4 w-4 text-muted-foreground" /> Form details
                    </button>
                    {draft.fields.length === 0 ? (
                        <Empty className="mt-3 border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon"><TextCursorInput aria-hidden="true" /></EmptyMedia>
                                <EmptyTitle>No fields yet</EmptyTitle>
                                <EmptyDescription>Add a field to start building your form.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <ul className="mt-2 divide-y border-t pt-1">
                            {draft.fields.map(field => {
                                const Icon = fieldIcons[field.type];
                                return (
                                    <li key={field.id}>
                                        <button type="button" disabled={disabled} aria-pressed={selectedID === field.id}
                                            onClick={() => onSelect(field.id)}
                                            className="builder-field-row">
                                            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">{field.label || "Untitled field"}</span>
                                                <span className="block text-xs text-muted-foreground">{fieldTypes.find(type => type.value === field.type)?.label}</span>
                                            </span>
                                            {field.required && <span className="text-xs font-medium text-muted-foreground">Required</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
            <aside aria-label="Form settings" className="builder-settings">
                <div className="builder-heading">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold">{selected ? "Field settings" : "Form details"}</h2>
                        {selected && <p className="truncate text-xs text-muted-foreground">{selected.label || "Untitled field"}</p>}
                    </div>
                </div>
                {selected ? (
                    <FieldSet disabled={disabled} className="px-5 py-5 sm:px-6">
                        <FieldLegend className="sr-only">Selected field settings</FieldLegend>
                        <FieldGroup className="gap-4">
                            <Field data-disabled={disabled}>
                                <FieldLabel htmlFor="selected-field-label">Field label</FieldLabel>
                                <Input id="selected-field-label" disabled={disabled} maxLength={120} value={selected.label}
                                    onChange={event => onUpdate(selected.id, { label: event.target.value })} />
                            </Field>
                            <Field data-disabled={disabled}>
                                <FieldLabel htmlFor="selected-field-type">Field type</FieldLabel>
                                <Select value={selected.type} disabled={disabled}
                                    onValueChange={value => onUpdate(selected.id, { type: value as FieldType, rules: undefined })}>
                                    <SelectTrigger id="selected-field-type" aria-describedby={selected.rules ? "field-type-help" : undefined}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {fieldTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {selected.rules && <FieldDescription id="field-type-help">Changing the type clears these validation rules.</FieldDescription>}
                            </Field>
                            <Field orientation="horizontal" data-disabled={disabled}>
                                <Checkbox id="selected-field-required" checked={selected.required} disabled={disabled}
                                    onCheckedChange={checked => onUpdate(selected.id, { required: checked === true })} />
                                <FieldLabel htmlFor="selected-field-required">Required answer</FieldLabel>
                            </Field>
                        </FieldGroup>
                        {selected.type !== "boolean" && (
                            <>
                                <Separator />
                                <RulesEditor key={selected.id + ":" + selected.type} field={selected} disabled={disabled}
                                    onChange={rules => onUpdate(selected.id, { rules })} />
                            </>
                        )}
                        <Separator />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Move field up">
                                <ArrowUp data-icon="inline-start" aria-hidden="true" />
                            </Button>
                            <Button type="button" size="sm" variant="outline" disabled={index === draft.fields.length - 1} onClick={() => onMove(index, 1)} aria-label="Move field down">
                                <ArrowDown data-icon="inline-start" aria-hidden="true" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="ml-auto gap-2 text-destructive hover:text-destructive"
                                onClick={() => onRemove(selected.id)}>
                                <Trash2 data-icon="inline-start" /> Remove field
                            </Button>
                        </div>
                    </FieldSet>
                ) : (
                    <FieldSet disabled={disabled} className="px-5 py-5 sm:px-6">
                        <FieldLegend className="sr-only">Form details</FieldLegend>
                        <FieldGroup className="gap-4">
                            <Field data-disabled={disabled}>
                                <FieldLabel htmlFor="form-title">Title</FieldLabel>
                                <Input id="form-title" disabled={disabled} maxLength={120} value={draft.title}
                                    onChange={event => onDetails({ title: event.target.value })} />
                            </Field>
                            <Field data-disabled={disabled}>
                                <FieldLabel htmlFor="form-description">Description</FieldLabel>
                                <Textarea id="form-description" rows={4} disabled={disabled}
                                    maxLength={2000} value={draft.description}
                                    onChange={event => onDetails({ description: event.target.value })} />
                            </Field>
                        </FieldGroup>
                        <Separator />
                        <ApprovalSettingsEditor formID={formID} settings={draft} disabled={disabled} onChange={onDetails} />
                    </FieldSet>
                )}
            </aside>
        </div>
    );
}
