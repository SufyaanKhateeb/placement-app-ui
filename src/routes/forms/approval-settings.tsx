import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/config/api";
import { adminFormsPath } from "./api";
import type { FormDefinition, FormSummary, RoleChoice } from "./api";

type ApprovalSettings = Pick<FormDefinition, "approvalAction" | "requiresApprovalGrant">;

export function ApprovalSettingsEditor({ formID, settings, disabled, onChange }: {
    formID: number;
    settings: ApprovalSettings;
    disabled: boolean;
    onChange: (value: Partial<ApprovalSettings>) => void;
}) {
    const action = settings.approvalAction;
    const needsTarget = action?.kind === "follow_up_form";
    const forms = useQuery({
        queryKey: ["adminForms"],
        queryFn: async () => (await api.get<FormSummary[]>(adminFormsPath)).data,
        enabled: needsTarget,
        retry: false,
    });
    const targets = forms.data?.filter(form => form.id !== formID && form.publishedVersion > 0 && form.requiresApprovalGrant) ?? [];
    const roles = useQuery({
        queryKey: ["access", "approval-roles"],
        queryFn: async () => (await api.get<RoleChoice[]>(adminFormsPath + "/approval-roles")).data,
        enabled: action?.kind === "assign_role",
        retry: false,
    });
    const options = roles.data ?? [];

    return (
        <FieldSet disabled={disabled} className="gap-3">
            <FieldLegend variant="label">Approval and access</FieldLegend>
            <FieldGroup className="gap-4">
                <Field>
                    <FieldLabel htmlFor="approval-action">On approval</FieldLabel>
                    <Select value={action?.kind ?? "verification_only"} disabled={disabled} onValueChange={kind => {
                        if (kind === "follow_up_form") onChange({ approvalAction: { kind, formId: 0 } });
                        else if (kind === "assign_role") onChange({ approvalAction: { kind } });
                        else onChange({ approvalAction: undefined });
                    }}>
                        <SelectTrigger id="approval-action"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="verification_only">Record verification only</SelectItem>
                                <SelectItem value="follow_up_form">Unlock a follow-up form</SelectItem>
                                <SelectItem value="assign_role">Assign an application role</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldDescription>The selected action applies to submissions made against this published version.</FieldDescription>
                </Field>
                {needsTarget && (
                    <Field data-disabled={disabled || targets.length === 0}>
                        <FieldLabel htmlFor="approval-follow-up">Follow-up form</FieldLabel>
                        <Select value={action.formId > 0 ? String(action.formId) : ""} disabled={disabled || targets.length === 0}
                            onValueChange={value => onChange({ approvalAction: { kind: "follow_up_form", formId: Number(value) } })}>
                            <SelectTrigger id="approval-follow-up"><SelectValue placeholder="Select a form" /></SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {targets.map(form => <SelectItem key={form.id} value={String(form.id)}>{form.title}</SelectItem>)}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FieldDescription>
                            {forms.isPending ? "Loading forms…" : forms.isError ? "Could not load follow-up forms." :
                                targets.length === 0 ? "Publish a form with Require an approval grant enabled to make it selectable." :
                                "Only published forms that require an approval grant are listed."}
                        </FieldDescription>
                    </Field>
                )}
                {action?.kind === "assign_role" && (
                    <Field data-disabled={disabled}>
                        <FieldLabel htmlFor="approval-role">Application role</FieldLabel>
                        <Select value={options.some(role => role.id === action.roleId) ? String(action.roleId) : ""}
                            disabled={disabled || options.length === 0}
                            onValueChange={value => onChange({ approvalAction: { kind: "assign_role", roleId: Number(value) } })}>
                            <SelectTrigger id="approval-role"><SelectValue placeholder="Select an eligible role" /></SelectTrigger>
                            <SelectContent>
                                <SelectGroup>{options.map(role => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectGroup>
                            </SelectContent>
                        </Select>
                        <FieldDescription>
                            {roles.isPending ? "Loading roles…" : roles.isError ? "Could not load approval roles." :
                                options.length === 0 ? "A Role Manager can make a custom role eligible for approval." :
                                action.role && !action.roleId ? "This version uses a legacy role key. Select a role when editing the draft." :
                                action.roleId && !options.some(role => role.id === action.roleId) ?
                                    "The saved role is unavailable. Choose an eligible role before saving." :
                                    "Only roles eligible for form approval are listed."}
                        </FieldDescription>
                    </Field>
                )}
                <Field orientation="horizontal" data-disabled={disabled}>
                    <Checkbox id="approval-grant-required" aria-describedby="approval-grant-help" disabled={disabled} checked={Boolean(settings.requiresApprovalGrant)}
                        onCheckedChange={checked => onChange({ requiresApprovalGrant: checked === true })} />
                    <div>
                        <FieldLabel htmlFor="approval-grant-required">Require an approval grant to access this form</FieldLabel>
                        <FieldDescription id="approval-grant-help">Enable this when another form will unlock this one.</FieldDescription>
                    </div>
                </Field>
            </FieldGroup>
        </FieldSet>
    );
}
