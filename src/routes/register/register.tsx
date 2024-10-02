import { useAuthContext } from "@/auth/hooks";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loading from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, HomeIcon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, redirect, useLocation } from "react-router-dom";
import z from "zod";
import { useRegisterMutation } from "./queryHooks";

export function RegisterPage() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = params.get("from") || "/";

    return (
        <>
            {/* {!!loginMutation.error && <p className="text-red-500">{loginMutation.error.message}</p>}
            login form
            <button onClick={() => loginMutation.mutate({ email: "", password: "" })}>login</button> */}
            {/* <div className="md:hidden">
                <Image src="/examples/authentication-light.png" width={1280} height={843} alt="Authentication" className="block dark:hidden" />
                <Image src="/examples/authentication-dark.png" width={1280} height={843} alt="Authentication" className="hidden dark:block" />
            </div> */}
            <div className="container max-w-8xl relative flex flex-col items-center justify-center sm:grid lg:grid-cols-2 lg:px-0">
                <Link to="/" className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 px-0 absolute right-8 top-4")}>
                    <HomeIcon />
                </Link>
                <div className="relative hidden h-full flex-col justify-center p-10 lg:flex">
                    {/* <div className="absolute inset-0 bg-muted" /> */}
                    {/* <div className="relative z-20 flex items-center text-lg font-medium">
                        <HandshakeIcon className="mr-2 h-6 w-6" />
                        {siteConfig.name}
                    </div> */}
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
                            <h1 className="text-4xl font-semibold">Create an account</h1>
                            <p className="text-sm text-muted-foreground">Please enter your details below to create an account.</p>
                        </div>
                        <RegisterForm fromUrl={from} />
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                                Login
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

function RegisterForm({ className, ...props }: UserAuthFormProps) {
    const { setIsAuthenticated } = useAuthContext();
    const queryClient = useQueryClient();

    const {
        mutateAsync,
        isError,
        error: registerError,
    } = useRegisterMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getUser"] });
            setIsAuthenticated(true);
            redirect(props.fromUrl || "/");
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
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or register with</span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isSubmitting}>
                <Icons.gitHub className="mr-2 h-4 w-4" />
                GitHub
            </Button>
        </div>
    );
}
