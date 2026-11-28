import { usePendingEmailVerification } from "@/auth/use-pending-email-verification";
import { EmailVerification } from "@/auth/email-verification";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "./queryHooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/ui/loading";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { userSignInDestination } from "@/auth/sign-in-destination";

import { api, apiBaseUrl } from "@/config/api";

function GoogleSignInButton({ admin }: { admin: boolean }) {
    const { data } = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await api.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
    });

    if (!data?.google) return null;

    return (
        <Button variant="outline" asChild>
            <a href={apiBaseUrl + (admin ? "/auth/google/admin" : "/auth/google")}>Continue with Google</a>
        </Button>
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
        <div className="flex flex-1 px-4 py-8">
            <section className="auth-panel">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{admin ? "Admin sign-in" : "Welcome back"}</h1>
                    <p className="text-sm text-muted-foreground">
                        {admin ? "Use your admin account to sign in." : "Sign in to browse published forms."}
                    </p>
                </div>
                {googleError && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{googleError}</AlertDescription>
                    </Alert>
                )}
                <GoogleSignInButton admin={admin} />
                <LoginForm fromUrl={from} admin={admin} />
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {admin ? (
                        <Link to="/login" className="underline underline-offset-4">User sign-in</Link>
                    ) : (
                        <>
                            <Link to={"/register?" + registerSearch} className="underline underline-offset-4">Create account</Link>
                            <Link to="/admin/login" className="underline underline-offset-4">Admin sign-in</Link>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

const LoginFormSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, "Password required"),
});

type LoginForm = z.infer<typeof LoginFormSchema>;

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement> & {
    fromUrl?: string;
    admin: boolean;
};

function LoginForm({ className, fromUrl, admin, ...props }: UserAuthFormProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [verification, setVerification] = usePendingEmailVerification();

    function completeLogin() {
        queryClient.invalidateQueries({ queryKey: ["getUser"] });
        setIsAuthenticated(true);
        navigate(fromUrl || "/forms", { replace: true });
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
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            {...register("email")}
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            required
                        />
                        {errors.email?.message && <label className="text-sm text-red-500">{errors.email?.message}</label>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            {...register("password")}
                            id="password"
                            placeholder="password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect="off"
                            required
                        />
                        {errors.password?.message && <label className="text-xs text-red-500">{errors.password?.message}</label>}
                    </div>
                    {isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{loginError.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loading /> : "Sign In with Email"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
