import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { useGetUserQuery } from "@/auth/queryHooks";
import Header from "@/components/header";

export default function Layout() {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"], enabled: true });
    const { pathname } = useLocation();
    const viewport = useRef<HTMLElement>(null);
    const view = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isPending) setIsAuthenticated(Boolean(user));
    }, [isPending, user]);

    useEffect(() => {
        viewport.current?.scrollTo({ top: 0 });
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const animation = view.current?.animate(
            [{ opacity: 0.85 }, { opacity: 1 }],
            { duration: 120, easing: "ease-out" },
        );
        return () => animation?.cancel();
    }, [pathname]);

    return (
        <div className="workspace-shell" data-workspace={Boolean(user)}>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
                Skip to content
            </a>
            <Header />
            <main id="main-content" ref={viewport} tabIndex={-1} className="workspace-main">
                <div ref={view} className="flex min-h-full min-w-0 flex-col">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
