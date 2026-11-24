import { axiosInstance } from "@/config/axios";
import type { RoleChoice } from "@/routes/forms/api";

export const accessPath = "/admin/access";
export const accessKey = ["access"] as const;

export type Role = RoleChoice & {
    builtin: boolean;
    approvalEligible: boolean;
    permissions: string[];
};

export type Permission = {
    key: string;
    label: string;
    reserved: boolean;
    approvalSafe: boolean;
};

export type LegacyKey = { key: string; roleId: number | null };
export type Catalog = { roles: Role[]; permissions: Permission[]; legacyKeys: LegacyKey[] };
export type Account = { type: "admin" | "user"; id: number; name: string; email: string };
export type Assignment = { roleId: number; name: string; submissionId?: number; active: boolean; revoked: boolean };

export type AuditEntry = {
    id: number;
    occurredAt: string;
    actorType: Account["type"] | null;
    actorId: number | null;
    actorName: string | null;
    action: string;
    detail: {
        accountType?: Account["type"];
        accountId?: number;
        roleId?: number;
        roleKey?: string;
        submissionId?: number;
        legacyKey?: string;
        before?: Pick<Role, "name" | "permissions" | "approvalEligible">;
        after?: Pick<Role, "name" | "permissions" | "approvalEligible">;
    };
};

export async function readAccess<T>(path = "", params?: Record<string, string | number | undefined>): Promise<T> {
    return (await axiosInstance.get<T>(accessPath + path, { params })).data;
}
