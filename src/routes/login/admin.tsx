import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useGetUserQuery } from "@/auth/queryHooks";
import { permissions } from "@/auth/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/config/axios";
import { isAxiosError } from "axios";

const errors: Record<string, string> = {
    google_failed: "Google could not be connected. Please try again.",
    google_admin_email_mismatch: "Choose the Google account with the same email as your admin account.",
    google_admin_link_conflict: "This Google account or admin account is already linked.",
};

export function AdminPage() {
    const [params] = useSearchParams();
    const [password, setPassword] = useState("");
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"], enabled: true });
    const { data: connection, isError: connectionError } = useQuery({
        queryKey: ["adminGoogleConnection", user?.id],
        queryFn: async () => (await axiosInstance.get<{ linked: boolean }>("/auth/google/admin/link")).data,
        enabled: user?.role === "admin",
        retry: false,
    });
    const connect = useMutation({
        mutationFn: async (password: string) => {
            const response = await axiosInstance.post<{ url: string }>("/auth/google/admin/link", { password });
            return response.data.url;
        },
        onSuccess: url => window.location.assign(url),
    });

    if (isPending) return null;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.role !== "admin") {
        return (
            <section className="mx-auto max-w-md px-6 py-12">
                <h1 className="text-xl font-semibold">Admin access required</h1>
                <Button className="mt-4" variant="outline" asChild><Link to="/admin/login">Sign in as admin</Link></Button>
            </section>
        );
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        connect.mutate(password);
        setPassword("");
    }

    const callbackError = errors[params.get("error") ?? ""];
    let requestError = "";
    if (connect.isError) {
        const status = isAxiosError(connect.error) ? connect.error.response?.status : undefined;
        requestError = status === 401
            ? "Your admin session expired. Sign in again."
            : status === 403
                ? "The password could not be verified. Check it and try again."
                : "Could not start the Google connection. Please try again.";
    }

    return (
        <section className="workspace-page max-w-3xl">
            <div className="workspace-page-heading">
                <h1>Admin account</h1>
                {user.permissions.includes(permissions.manageForms) && (
                    <Button size="sm" variant="outline" asChild><Link to="/admin/forms">Manage forms</Link></Button>
                )}
            </div>
            {connection?.linked ? (
                <p role="status" className="text-sm text-muted-foreground">Google is connected. You can use it to sign in as an admin.</p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Connect the Google account that uses {user.email}. Confirm your current admin password to continue.
                </p>
            )}
            {callbackError && <Alert variant="destructive"><AlertDescription>{callbackError}</AlertDescription></Alert>}
            {requestError && <Alert variant="destructive"><AlertDescription>{requestError}</AlertDescription></Alert>}
            {connectionError && <p className="text-sm" role="status">Google connection settings are unavailable.</p>}
            {connection && !connection.linked && (
                <form className="grid gap-3" onSubmit={onSubmit}>
                    <Label htmlFor="admin-connect-password">Current password</Label>
                    <Input id="admin-connect-password" type="password" autoComplete="current-password"
                        value={password} onChange={event => setPassword(event.target.value)} required />
                    <Button type="submit" disabled={connect.isPending}>
                        {connect.isPending ? "Connecting…" : "Connect Google"}
                    </Button>
                </form>
            )}
            <Link className="text-sm underline underline-offset-4" to="/">Back to home</Link>
        </section>
    );
}
