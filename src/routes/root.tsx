import { ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/auth/auth-store";
import { useGetUserQuery } from "@/auth/queryHooks";
import { Button } from "@/components/ui/button";

export default function Root() {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"] });
    const signingIn = useAuthStore(store => store.isAuthenticated);

    return (
        <section className="workspace-page">
            <div className="flex max-w-3xl flex-col items-start gap-5 rounded-xl border bg-card p-6 sm:p-10">
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <ClipboardList className="size-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Training &amp; Placements</h1>
                    <p className="text-sm text-muted-foreground">
                        {user?.role === "admin" ? "Manage drafts and publish forms for users." : "Find forms published for you."}
                    </p>
                </div>
                {!isPending && (user || !signingIn) && (
                    <div className="flex flex-wrap gap-2">
                        {user ? (
                            <>
                                {user.role === "admin" && <Button asChild><Link to="/admin/forms">Manage forms</Link></Button>}
                                <Button variant={user.role === "admin" ? "outline" : "default"} asChild>
                                    <Link to="/forms">Browse forms</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button className="gap-2" asChild>
                                    <Link to="/login">Sign in to view forms <ArrowRight data-icon="inline-end" aria-hidden="true" /></Link>
                                </Button>
                                <Button variant="outline" asChild><Link to="/register">Create account</Link></Button>
                                <Button variant="ghost" asChild><Link to="/admin/login">Admin sign-in</Link></Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
