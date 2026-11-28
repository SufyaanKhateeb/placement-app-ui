import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CircleCheck, Link2 } from "lucide-react";
import { useGetUserQuery } from "@/auth/queryHooks";
import { permissions } from "@/auth/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api, isApiError } from "@/config/api";
import { PasswordInput } from "./password-input";

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
    const providers = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await api.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
        enabled: Boolean(user),
    });
    const connection = useQuery({
        queryKey: ["googleConnection", connectionPath, user?.id],
        queryFn: async () => (await api.get<{ linked: boolean; canLink?: boolean }>(connectionPath)).data,
        enabled: Boolean(providers.data?.google && user?.role === (admin ? "admin" : "user")),
        retry: false,
    });
    const connect = useMutation({
        mutationFn: async (password: string) => {
            const response = await api.post<{ url: string }>(connectionPath, { password });
            return response.data.url;
        },
        onSuccess: url => window.location.assign(url),
    });

    if (isPending) return <p role="status" className="workspace-page text-sm text-muted-foreground">Loading account…</p>;
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
        if (connect.isPending || connect.isSuccess) return;
        connect.mutate(password);
        setPassword("");
    }

    const callbackError = errors[params.get("error") ?? ""];
    let requestError = "";
    if (connect.isError) {
        const status = isApiError(connect.error) ? connect.error.response?.status : undefined;
        requestError = status === 401
            ? "Your session expired. Sign in again."
            : status === 403
                ? "The password could not be verified. Check it and try again."
                : "Could not start the Google connection. Please try again.";
    }
    const checking = providers.isPending || (providers.data?.google && connection.isPending);
    const connectionFailed = providers.isLoadingError || connection.isLoadingError;
    const linked = connection.data?.linked;

    return (
        <section className="account-page">
            <header className="account-heading">
                <div className="min-w-0">
                    <h1>{admin ? "Admin account" : "Account"}</h1>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{user.email}</p>
                </div>
                {admin && user.permissions.includes(permissions.manageForms) && (
                    <Button size="sm" variant="outline" asChild><Link to="/admin/forms">Manage forms</Link></Button>
                )}
            </header>
            <section className="connection-panel" aria-labelledby="google-connection-heading">
                <header className="connection-heading">
                    <span className="connection-icon"><Link2 className="size-5" aria-hidden="true" /></span>
                    <div className="min-w-0">
                        <h2 id="google-connection-heading" className="text-base font-semibold">Google sign-in</h2>
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                            {linked ? user.email : "Use Google to sign in to this account."}
                        </p>
                    </div>
                    {connection.data && (
                        <Badge variant={linked ? "secondary" : "outline"} className="connection-status gap-1.5">
                            {linked && <CircleCheck className="size-3.5" aria-hidden="true" />}
                            {linked ? "Connected" : "Not connected"}
                        </Badge>
                    )}
                </header>
                <div className="connection-body">
                    {checking && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner aria-hidden="true" /> Checking Google connection…
                    </p>}
                    {providers.data?.google === false && <p className="text-sm text-muted-foreground">Google sign-in is currently unavailable.</p>}
                    {connectionFailed && (
                        <Alert variant="destructive">
                            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                                Could not check your Google connection.
                                <Button type="button" size="sm" variant="outline" disabled={providers.isFetching || connection.isFetching}
                                    onClick={() => void (providers.isLoadingError ? providers.refetch() : connection.refetch())}>Try again</Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {callbackError && <Alert variant="destructive"><AlertDescription>{callbackError}</AlertDescription></Alert>}
                    {linked && <p role="status" className="text-sm text-muted-foreground">
                        {admin ? "You can use Google on the admin sign-in page." : "You can use Google the next time you sign in."}
                    </p>}
                    {connection.data?.canLink === false && !linked && (
                        <p className="text-sm text-muted-foreground">Verify your email and sign in with your password to connect Google.</p>
                    )}
                    {connection.data && !linked && connection.data.canLink !== false && (
                        <form onSubmit={onSubmit}>
                            <FieldGroup className="gap-4">
                                <Field className="max-w-sm gap-2">
                                    <FieldLabel htmlFor="google-connect-password" className="text-sm font-medium">Current password</FieldLabel>
                                    <PasswordInput id="google-connect-password" autoComplete="current-password" aria-describedby="google-connect-help"
                                        value={password} onChange={event => setPassword(event.target.value)} required
                                        disabled={connect.isPending || connect.isSuccess} />
                                    <FieldDescription id="google-connect-help">Confirm your password, then choose the Google account that uses this email.</FieldDescription>
                                </Field>
                                {requestError && <Alert variant="destructive"><AlertDescription>{requestError}</AlertDescription></Alert>}
                                <Button type="submit" className="w-fit gap-2" disabled={connect.isPending || connect.isSuccess}>
                                    {(connect.isPending || connect.isSuccess) && <Spinner data-icon="inline-start" aria-hidden="true" />}
                                    {connect.isPending ? "Connecting…" : connect.isSuccess ? "Opening Google…" : "Connect Google"}
                                </Button>
                            </FieldGroup>
                        </form>
                    )}
                </div>
            </section>
        </section>
    );
}
