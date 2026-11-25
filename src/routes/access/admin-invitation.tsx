import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useGetUserQuery } from "@/auth/queryHooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/config/axios";
import { requestError } from "@/routes/forms/api";
import { RegisterForm } from "@/routes/register/register";

const invitationAPI = "/auth/admin-invitation";
type Invitation = { email: string; enrolled: boolean };

export function AdminInvitationPage() {
    const { hash, search } = useLocation();
    const token = hash === "#main-content" ? "" : hash.slice(1);
    return <AdminInvitation key={token} token={token} search={search} />;
}

function AdminInvitation({ token, search }: { token: string; search: string }) {
    const [invitation, setInvitation] = useState<Invitation>();
    const [loadError, setLoadError] = useState("");
    const { data: user, isFetching: checkingSession } = useGetUserQuery({ queryKey: ["getUser"] });
    const { data: providers } = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await axiosInstance.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
    });
    const accept = useMutation({
        mutationFn: () => axiosInstance.post(invitationAPI + "/accept", {}),
    });

    useEffect(() => {
        const controller = new AbortController();
        const options = { signal: controller.signal };
        const request = token
            ? axiosInstance.post<Invitation>(invitationAPI + "/open", { token }, options)
            : axiosInstance.get<Invitation>(invitationAPI, options);
        void request.then(({ data }) => {
            if (controller.signal.aborted) return;
            if (token && window.location.hash.slice(1) === token) {
                window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
            }
            setInvitation(data);
        }).catch(error => {
            if (!controller.signal.aborted) setLoadError(requestError(error, "Could not open the invitation. Try opening the email link again."));
        });
        return () => controller.abort();
    }, [token]);

    const providerError = new URLSearchParams(search).get("error");
    const api = (axiosInstance.defaults.baseURL ?? "/api/v1").replace(/\/$/, "");
    const invitedAccount = user?.role === "user" && user.email.toLowerCase() === invitation?.email;
    const signIn = "/login?" + new URLSearchParams({ from: "/admin/invitation" }).toString();

    return (
        <div className="flex flex-1 px-4 py-8">
            <section className="auth-panel">
                <h1 className="text-2xl font-semibold tracking-tight">Admin invitation</h1>
                {accept.isSuccess ? (
                    <>
                        <p role="status">Invitation accepted. Sign in as an admin to start using your new access.</p>
                        <Button asChild><Link to="/admin/login">Sign in as admin</Link></Button>
                    </>
                ) : loadError ? (
                    <Alert variant="destructive" role="alert"><AlertDescription>{loadError}</AlertDescription></Alert>
                ) : !invitation ? (
                    <p role="status">Checking your invitation…</p>
                ) : (
                    <>
                        <p className="break-words text-sm">Invitation for <strong>{invitation.email}</strong></p>
                        {providerError && (
                            <Alert variant="destructive" role="alert">
                                <AlertDescription>{providerError === "google_invitation_mismatch"
                                    ? "Use a Google account with the invited email address."
                                    : "Google sign-in could not be completed. Try again."}</AlertDescription>
                            </Alert>
                        )}
                        {invitation.enrolled && checkingSession ? (
                            <p role="status">Checking your session…</p>
                        ) : invitation.enrolled && invitedAccount ? (
                            <Button disabled={accept.isPending} onClick={() => accept.mutate()}>Accept admin invitation</Button>
                        ) : (
                            <>
                                {providers?.google && (
                                    <Button variant="outline" asChild>
                                        <a href={api + "/auth/google/invitation"} referrerPolicy="no-referrer">Continue with Google</a>
                                    </Button>
                                )}
                                {invitation.enrolled ? (
                                    <>
                                        <p className="text-sm">Sign in with the account you created for this invitation.</p>
                                        <Button variant="outline" asChild><Link to={signIn}>Sign in with password</Link></Button>
                                    </>
                                ) : (
                                    <RegisterForm invitationEmail={invitation.email}
                                        onInvitedAccountCreated={() => setInvitation({ ...invitation, enrolled: true })} />
                                )}
                            </>
                        )}
                        {accept.isError && (
                            <Alert variant="destructive" role="alert">
                                <AlertDescription>{requestError(accept.error, "Could not accept the invitation.")}</AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
