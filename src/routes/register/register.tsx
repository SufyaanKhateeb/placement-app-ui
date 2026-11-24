import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loading from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import z from "zod";
import { useRegisterMutation } from "./queryHooks";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { userSignInDestination } from "@/auth/sign-in-destination";

export function RegisterPage() {
    const location = useLocation();
    const from = userSignInDestination(location.search);
    const signInSearch = new URLSearchParams({ from }).toString();

    return (
        <div className="flex flex-1 px-4 py-8">
            <section className="auth-panel">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <RegisterForm fromUrl={from} />
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to={"/login?" + signInSearch} className="underline underline-offset-4">Sign in</Link>
                </p>
            </section>
        </div>
    );
}

const RegisterFormSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .refine((value) => /[a-zA-Z]/.test(value), { message: "Password must contain at least one letter" })
        .refine((value) => /[0-9]/.test(value), { message: "Password must contain at least one number" })
        .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), { message: "Password must contain at least one special character" }),
});

type RegisterForm = z.infer<typeof RegisterFormSchema>;

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement> & {
    fromUrl?: string;
};

function RegisterForm({ className, fromUrl, ...props }: UserAuthFormProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        mutateAsync,
        isError,
        error: registerError,
    } = useRegisterMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getUser"] });
            setIsAuthenticated(true);
            navigate(fromUrl || "/forms", { replace: true });
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
        resolver: zodResolver(RegisterFormSchema),
    });

    const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
        await mutateAsync(data);
    };

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                {...register("firstName")}
                                id="firstName"
                                placeholder="First Name"
                                autoCapitalize="none"
                                autoComplete="given-name"
                                autoCorrect="off"
                                required
                            />
                            {errors.firstName?.message && <label className="text-sm text-red-500">{errors.firstName?.message}</label>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                {...register("lastName")}
                                id="lastName"
                                placeholder="Last Name"
                                autoCapitalize="none"
                                autoComplete="family-name"
                                autoCorrect="off"
                                required
                            />
                            {errors.lastName?.message && <label className="text-sm text-red-500">{errors.lastName?.message}</label>}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            {...register("email")}
                            id="email"
                            placeholder="Email"
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
                            placeholder="Password"
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
                            <AlertDescription>{registerError.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loading /> : "Create account"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
