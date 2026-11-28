import { usePendingEmailVerification } from "@/auth/use-pending-email-verification";
import { EmailVerification } from "@/auth/email-verification";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "./queryHooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { userSignInDestination } from "@/auth/sign-in-destination";

import { api, apiBaseUrl } from "@/config/api";
import { PasswordInput } from "./password-input";

function GoogleSignIn({ admin }: { admin: boolean }) {
    const { data, isPending, isError } = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await api.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
    });

    if (isPending) return <p role="status" className="text-sm text-muted-foreground">Checking Google sign-in availability…</p>;
    if (isError) return <p role="status" className="text-sm text-muted-foreground">Google sign-in is unavailable. You can sign in with email.</p>;
    if (!data?.google) return null;

    return (
        <>
            <Button variant="outline" asChild>
                <a href={apiBaseUrl + (admin ? "/auth/google/admin" : "/auth/google")}>Continue with Google</a>
            </Button>
            <FieldSeparator>or sign in with email</FieldSeparator>
        </>
    );
}

export function LoginPage({ admin = false }: { admin?: boolean }) {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = admin ? "/admin" : userSignInDestination(location.search);
    const registerSearch = new URLSearchParams({ from }).toString();
    const providerError = params.get("error");
    const googleError = providerError === "google_invitation_required"
        ? "Open your admin invitation email to finish setting up your account."
        : providerError === "google_admin_unlinked"
        ? "Sign in with your admin password first to connect Google."
        : providerError === "google_admin_session_expired"
            ? "Your admin session expired. Sign in again to connect Google."
            : providerError === "google_link_required"
        ? "Sign in with your password first. After verifying your email, you can connect Google from your account settings."
        : providerError === "google_failed"
            ? "Google sign-in could not be completed. Please try again."
            : null;

    return (
        <div className="sign-in-page">
            <section className="sign-in-panel" aria-labelledby="sign-in-heading">
                <div className="flex flex-col gap-2">
                    <h1 id="sign-in-heading" className="text-2xl font-semibold tracking-tight">{admin ? "Admin sign-in" : "User sign-in"}</h1>
                    <p className="text-sm text-muted-foreground">
                        {admin ? "Manage placement forms and review submissions." : "Find placement forms and track your submissions."}
                    </p>
                </div>
                <nav aria-label="Sign-in type" className="sign-in-modes">
                    <Button type="button" size="sm" variant="ghost" asChild><NavLink to="/login" end>User</NavLink></Button>
                    <Button type="button" size="sm" variant="ghost" asChild><NavLink to="/admin/login" end>Admin</NavLink></Button>
                </nav>
                {googleError && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{googleError}</AlertDescription>
                    </Alert>
                )}
                <LoginForm key={admin ? "admin" : "user"} fromUrl={from} admin={admin} />
                {!admin && <Button variant="link" size="sm" className="self-start px-0" asChild>
                    <Link to={"/register?" + registerSearch}>Create account</Link>
                </Button>}
            </section>
        </div>
    );
}

const LoginFormSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, "Password required"),
});

type LoginForm = z.infer<typeof LoginFormSchema>;

function LoginForm({ fromUrl, admin }: { fromUrl: string; admin: boolean }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [verification, setVerification] = usePendingEmailVerification();

    function completeLogin() {
        queryClient.invalidateQueries({ queryKey: ["getUser"] });
        setIsAuthenticated(true);
        navigate(fromUrl, { replace: true });
    }

    const {
        mutateAsync,
        isError,
        error: loginError,
    } = useLoginMutation({
        onSuccess: result => {
            if (result?.verificationRequired) {
                resetField("password");
                setVerification(result);
            }
            else completeLogin();
        },
    }, admin);

    const {
        register,
        handleSubmit,
        resetField,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        defaultValues: {
            email: "",
            password: "",
        },
        resolver: zodResolver(LoginFormSchema),
    });

    const onSubmit: SubmitHandler<LoginForm> = async (data) => {
        await mutateAsync(data).catch(() => undefined);
    };

    if (!admin && verification) {
        return <EmailVerification deliveryError={verification.deliveryWarning} onComplete={completeLogin}
            onCancel={() => setVerification(undefined)} />;
    }

    return (
        <div className="flex flex-col gap-5">
            <GoogleSignIn admin={admin} />
            <form noValidate onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup className="gap-4">
                    <Field invalid={!!errors.email} data-invalid={!!errors.email} className="gap-2">
                        <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                        <Input
                            {...register("email")}
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "login-email-error" : undefined}
                            required
                        />
                        {errors.email && <FieldError id="login-email-error">{errors.email.message}</FieldError>}
                    </Field>
                    <Field invalid={!!errors.password} data-invalid={!!errors.password} className="gap-2">
                        <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                        <PasswordInput
                            {...register("password")}
                            id="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect="off"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "login-password-error" : undefined}
                            required
                        />
                        {errors.password && <FieldError id="login-password-error">{errors.password.message}</FieldError>}
                    </Field>
                    {isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{loginError.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                        {isSubmitting && <Spinner data-icon="inline-start" aria-hidden="true" />}
                        {isSubmitting ? "Signing in…" : "Sign In with Email"}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    );
}
