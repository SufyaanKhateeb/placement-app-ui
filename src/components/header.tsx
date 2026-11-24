import { ClipboardList, FileText, House, Inbox, Shield, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/auth/auth-store";
import { useGetUserQuery } from "@/auth/queryHooks";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import ProfileButton from "./profile-button";
import { Button } from "./ui/button";

export default function Header() {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"] });
    const signingIn = useAuthStore(store => store.isAuthenticated);
    const workspaceLinks: { to: string; label: string; end?: boolean; icon: LucideIcon }[] = [
        { to: "/", label: "Home", end: true, icon: House },
        { to: "/forms", label: "Forms", icon: FileText },
    ];
    if (user?.role === "admin") {
        workspaceLinks.push(
            { to: "/admin/forms", label: "Manage forms", icon: ClipboardList },
            { to: "/admin/submissions", label: "Submissions", icon: Inbox },
            { to: "/admin", label: "Admin account", end: true, icon: Shield },
        );
    }
    const guestLinks = !isPending && !signingIn && !user ? [
        { to: "/login", label: "Sign in" },
        { to: "/register", label: "Create account" },
        { to: "/admin/login", label: "Admin sign-in" },
    ] : [];

    return (
        <>
            <header className="workspace-topbar sticky top-0 z-40 border-b bg-background">
                <div className="flex min-h-14 items-center gap-2 px-4 sm:px-6">
                    <MobileNav links={user ? workspaceLinks.slice(1) : guestLinks} />
                    <MainNav />
                    {!user && (
                        <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-1 md:flex">
                            {guestLinks.map(({ to, label }) => (
                                <Button key={to} size="sm" variant="ghost" asChild className="aria-[current=page]:bg-accent">
                                    <NavLink to={to}>{label}</NavLink>
                                </Button>
                            ))}
                        </nav>
                    )}
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                        <ModeToggle />
                        <ProfileButton />
                    </div>
                </div>
            </header>
            {user && (
                <aside className="workspace-rail hidden min-h-0 flex-col gap-5 md:flex">
                    <div className="flex min-h-10 items-center px-2"><MainNav compact /></div>
                    <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                        {workspaceLinks.map(({ to, label, end, icon: Icon }) => (
                            <Button key={to} size="sm" variant="ghost" asChild className="workspace-nav-link justify-start gap-2">
                                <NavLink to={to} end={end}>
                                    <Icon data-icon="inline-start" aria-hidden="true" />
                                    {label}
                                </NavLink>
                            </Button>
                        ))}
                    </nav>
                    <div className="flex items-center justify-between gap-2 border-t pt-2">
                        <ProfileButton />
                        <ModeToggle />
                    </div>
                </aside>
            )}
        </>
    );
}
