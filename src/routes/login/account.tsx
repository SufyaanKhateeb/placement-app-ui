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
    google_user_email_mismatch: "Choose the Google account with the same email as your account.",
    google_user_link_conflict: "This Google account or Placement App account is already linked.",
    google_user_session_expired: "Sign in again with your password to connect Google.",
};

export function AccountPage({ admin = false }: { admin?: boolean }) {
    const connectionPath = admin ? "/auth/google/admin/link" : "/auth/google/link";
    const [params] = useSearchParams();
    const [password, setPassword] = useState("");
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"], enabled: true });
    const { data: providers } = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await axiosInstance.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
        enabled: Boolean(user),
    });
    const { data: connection, isError: connectionError } = useQuery({
        queryKey: ["googleConnection", connectionPath, user?.id],
        queryFn: async () => (await axiosInstance.get<{ linked: boolean; canLink?: boolean }>(connectionPath)).data,
        enabled: Boolean(providers?.google && user?.role === (admin ? "admin" : "user")),
        retry: false,
    });
    const connect = useMutation({
        mutationFn: async (password: string) => {
            const response = await axiosInstance.post<{ url: string }>(connectionPath, { password });
            return response.data.url;
        },
        onSuccess: url => window.location.assign(url),
    });

    if (isPending) return null;
    if (!user) return <Navigate to={admin ? "/admin/login" : "/login"} replace />;
    if (!admin && user.role === "admin") return <Navigate to="/admin" replace />;
    if (admin && user.role !== "admin") {
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
            ? "Your session expired. Sign in again."
            : status === 403
                ? "The password could not be verified. Check it and try again."
                : "Could not start the Google connection. Please try again.";
    }

    return (
        <section className="workspace-page max-w-3xl">
            <div className="workspace-page-heading">
                <h1>{admin ? "Admin account" : "Account"}</h1>
                {admin && user.permissions.includes(permissions.manageForms) && (
                    <Button size="sm" variant="outline" asChild><Link to="/admin/forms">Manage forms</Link></Button>
                )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {connection?.linked && (
                <p role="status" className="text-sm text-muted-foreground">
                    {admin ? "Google is connected. You can use it to sign in as an admin." : "Google is connected."}
                </p>
            )}
            {connection?.canLink === false && !connection.linked && (
                <p className="text-sm text-muted-foreground">
                    Sign in with your password and verify your email to connect Google. If you have admin access, use admin sign-in.
                </p>
            )}
            {callbackError && <Alert variant="destructive"><AlertDescription>{callbackError}</AlertDescription></Alert>}
            {requestError && <Alert variant="destructive"><AlertDescription>{requestError}</AlertDescription></Alert>}
            {connectionError && <p className="text-sm" role="status">Google connection settings are unavailable.</p>}
            {connection && !connection.linked && connection.canLink !== false && (
                <form className="grid gap-3" onSubmit={onSubmit}>
                    <p className="text-sm text-muted-foreground">Confirm your password to connect a Google account with the same email.</p>
                    <Label htmlFor="google-connect-password">Current password</Label>
                    <Input id="google-connect-password" type="password" autoComplete="current-password"
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
