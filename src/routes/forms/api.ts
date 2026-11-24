import { isAxiosError } from "axios";
import { axiosInstance } from "@/config/axios";

export const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "boolean", label: "Yes or no" },
    { value: "integer", label: "Whole number" },
    { value: "numeric", label: "Decimal number" },
    { value: "date", label: "Date" },
    { value: "timestamptz", label: "Date and time" },
] as const;

export type FieldType = (typeof fieldTypes)[number]["value"];

export type FieldRules = {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: string;
    max?: string;
};

export type FormField = {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    rules?: FieldRules;
};

export type ApprovalAction = { kind: "follow_up_form"; formId: number } | { kind: "assign_role"; role: string };

export type FormDefinition = {
    title: string;
    description: string;
    fields: FormField[];
    approvalAction?: ApprovalAction;
    requiresApprovalGrant?: boolean;
};

export type SubmissionStatus = "not_submitted" | "submitted" | "changes_requested" | "approved";

export type FormSummary = {
    id: number;
    title: string;
    hasDraft: boolean;
    publishedVersion: number;
    submissionStatus?: SubmissionStatus;
    requiresApprovalGrant?: boolean;
};

export type AdminForm = {
    id: number;
    revision: number;
    draft: FormDefinition | null;
    publishedVersion: number;
    published: FormDefinition | null;
};

export type PublishedForm = {
    id: number;
    version: number;
    definition: FormDefinition;
};

export const adminFormsPath = "/admin/forms";
export const publishedFormsPath = "/forms";

export function requestError(error: unknown, fallback: string) {
    if (isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error || fallback;
    }
    return fallback;
}

export function isDraftConflict(error: unknown) {
    return isAxiosError(error) && error.response?.status === 409;
}

export async function getAdminForm(id: string) {
    const response = await axiosInstance.get<AdminForm>(adminFormsPath + "/" + id);
    return response.data;
}
export type FormAnswer = string | number | boolean | null;
export type FormAnswers = Record<string, FormAnswer>;

export type ReviewCommentPart = { text: string } | { fieldId: string };

export type FormSubmission = {
    id: number;
    version: number;
    revision: number;
    status: Exclude<SubmissionStatus, "not_submitted">;
    submittedAt: string;
    definition: FormDefinition;
    values: FormAnswers;
    changes?: Record<string, string>;
    comment?: ReviewCommentPart[];
};

export type FormAnswerErrors = { error?: string; errors?: Record<string, string>; code?: string };
