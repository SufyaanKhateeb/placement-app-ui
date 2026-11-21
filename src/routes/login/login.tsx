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

import { axiosInstance } from "@/config/axios";

const fallbackAPI = "/api/v1";

function GoogleSignInButton({ admin }: { admin: boolean }) {
    const { data } = useQuery({
        queryKey: ["authProviders"],
        queryFn: async () => (await axiosInstance.get<{ google: boolean }>("/auth/providers")).data,
        retry: false,
        staleTime: 60_000,
    });

    if (!data?.google) return null;

    const api = (axiosInstance.defaults.baseURL || fallbackAPI).replace(/\/$/, "");
    return (
        <Button variant="outline" asChild>
            <a href={api + (admin ? "/auth/google/admin" : "/auth/google")}>Continue with Google</a>
        </Button>
    );
}

export function LoginPage({ admin = false }: { admin?: boolean }) {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = admin ? "/admin" : params.get("from") || "/";
    const providerError = params.get("error");
    const googleError = providerError === "google_admin_unlinked"
        ? "Sign in with your admin password first to connect Google."
        : providerError === "google_admin_session_expired"
            ? "Your admin session expired. Sign in again to connect Google."
            : providerError === "google_link_required"
        ? "This email already belongs to an account. Sign in with your existing method."
        : providerError === "google_failed"
            ? "Google sign-in could not be completed. Please try again."
            : null;

    return (
        <>
            <div className="container max-w-7xl h-full relative flex flex-col items-center justify-center sm:grid lg:grid-cols-2 lg:px-0">
                <div className="relative hidden h-full flex-col justify-center p-10 lg:flex">
                    <div className="relative z-20 max-w-96 mr-auto">
                        <blockquote className="space-y-2">
                            <p className="text-4xl font-bold">
                                &ldquo;Any fact facing us is not as important as our attitude toward it, for that determines our success or
                                failure.&rdquo;
                            </p>
                            <footer className="text-lg">Norman Vincent Peale</footer>
                        </blockquote>
                    </div>
                </div>
                <div className="lg:p-8">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-[350px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-4xl font-semibold">{admin ? "Admin sign-in" : "Welcome back"}</h1>
                            <p className="text-sm text-muted-foreground">Please enter your details below to sign in.</p>
                        </div>
                        {googleError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{googleError}</AlertDescription>
                            </Alert>
                        )}
                        <GoogleSignInButton admin={admin} />
                        <LoginForm fromUrl={from} admin={admin} />
                        <div className="flex justify-center gap-3 text-sm text-muted-foreground">
                            {admin ? (
                                <Link to="/login" className="underline underline-offset-4">User sign-in</Link>
                            ) : (
                                <>
                                    <Link to="/register" className="underline underline-offset-4">Register</Link>
                                    <Link to="/admin/login" className="underline underline-offset-4">Admin sign-in</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
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

    const {
        mutateAsync,
        isError,
        error: loginError,
    } = useLoginMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getUser"] });
            setIsAuthenticated(true);
            navigate(fromUrl || "/");
        },
    }, admin);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        defaultValues: {
            email: "",
            password: "",
        },
        resolver: zodResolver(LoginFormSchema),
    });

    const onSubmit: SubmitHandler<LoginForm> = async (data) => {
        await mutateAsync(data);
    };

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
                            placeholder="password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="password"
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
