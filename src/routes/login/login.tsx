import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "./queryHooks";
import { useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/ui/loading";
import { AlertCircle, HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/auth/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginPage() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = params.get("from") || "/";

    return (
        <>
            <div className="container max-w-8xl relative flex flex-col items-center justify-center sm:grid lg:grid-cols-2 lg:px-0">
                <Link to="/" className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 px-0 absolute right-8 top-4")}>
                    <HomeIcon />
                </Link>
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
                            <h1 className="text-4xl font-semibold">Welcome back</h1>
                            <p className="text-sm text-muted-foreground">Please enter your details below to sign in.</p>
                        </div>
                        <LoginForm fromUrl={from} />
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                                Register
                            </Link>
                        </p>
                        {/* <p className="px-8 text-center text-sm text-muted-foreground">
                            By clicking continue, you agree to our{" "}
                            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
                                Privacy Policy
                            </Link>
                            .
                        </p> */}
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
};

function LoginForm({ className, ...props }: UserAuthFormProps) {
    const { setIsAuthenticated } = useAuthContext();
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
            navigate(props.fromUrl || "/");
        },
    });

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
                            placeholder="name@college.com"
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
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isSubmitting}>
                <Icons.gitHub className="mr-2 h-4 w-4" />
                GitHub
            </Button>
        </div>
    );
}
