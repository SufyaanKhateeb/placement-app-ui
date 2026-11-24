import type { PropsWithChildren } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGetUserQuery } from "./queryHooks";

export function PermissionGuard({ permission, children }: PropsWithChildren<{ permission: string }>) {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"] });
    if (isPending) return <p role="status" className="px-6 py-8">Checking your session…</p>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.permissions.includes(permission)) return children;

    return (
        <section className="workspace-page max-w-lg">
            <h1 className="text-xl font-semibold">Access required</h1>
            <p className="text-sm text-muted-foreground">Your account does not have permission to open this page.</p>
            <Button className="w-fit" asChild><Link to="/">Return home</Link></Button>
        </section>
    );
}
