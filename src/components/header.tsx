import { Icons } from "./icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import gsap from "gsap";
import { useTheme } from "./theme-provider";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/auth/auth-store";
import ProfileButton from "./profile-button";

function Header() {
    const containerRef = useRef<HTMLElement>(null);
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const authenticated = useAuthStore((store) => store.isAuthenticated);
    const authActionsVisible = !authenticated && location.pathname !== "/login" && location.pathname !== "/register";

    useEffect(() => {
        const tl = gsap
            .timeline({
                scrollTrigger: {
                    scroller: ".main-layout-container",
                    end: "+=1",
                    toggleActions: "play none reverse none",
                },
            })
            .to(
                ".header-animation",
                {
                    duration: 0.3,
                    maxWidth: "50rem",
                    borderRadius: "0.5rem",
                    boxShadow:
                        theme === "dark"
                            ? "0 2px 4px #0c090854,0 6px 6px #0c09084a,0 14px 9px #0c09082b,0 26px 10px #0c09080d,0 40px 11px #0c090803,0 1px #d6cfc21f inset"
                            : "0 0 2px #5f4a2e14,0 2px 3px #5f4a2e0a,0 4px 6px #5f4a2e0a,0 20px 32px -12px #5f4a2e1f",
                },
                0
            )
            .fromTo(".header-actions-container", { duration: 0.3, x: authActionsVisible ? "95px" : "0px" }, { duration: 0.3, x: "0px" }, 0.2)
            .fromTo(".sign-up-button", { duration: 0.3, opacity: 0 }, { opacity: 1 }, "<0");

        return () => {
            tl.revert();
        };
    }, [theme, authActionsVisible]);

    return (
        <header ref={containerRef} className="header-animation-parent sticky top-0 md:top-6 z-50 w-full">
            <div className="header-animation container p-3 flex h-14 max-w-7xl items-center max-sm:!rounded-none border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
                <MainNav />
                <MobileNav />
                <div className="header-actions-container flex flex-1 items-center justify-end gap-2 md:justify-end">
                    <nav className="flex items-center">
                        <Link to={"/college-github"} target="_blank" rel="noreferrer">
                            <div
                                className={cn(
                                    buttonVariants({
                                        variant: "ghost",
                                    }),
                                    "h-8 w-8 px-0"
                                )}
                            >
                                <Icons.gitHub className="h-4 w-4" />
                                <span className="sr-only">GitHub</span>
                            </div>
                        </Link>
                        <Link to={"college-twitter"} target="_blank" rel="noreferrer">
                            <div
                                className={cn(
                                    buttonVariants({
                                        variant: "ghost",
                                    }),
                                    "h-8 w-8 px-0"
                                )}
                            >
                                <Icons.twitter className="h-3 w-3 fill-current" />
                                <span className="sr-only">Twitter</span>
                            </div>
                        </Link>
                        <ModeToggle />
                        <Button className={cn("ml-2", { hidden: !authActionsVisible })} size="sm" variant="ghost" onClick={() => navigate("/login")}>
                            Log in
                        </Button>
                        <Button
                            className={cn("sign-up-button ml-2", { hidden: !authActionsVisible })}
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/register")}
                        >
                            Sign up
                        </Button>
                        <ProfileButton />
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;

// <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//     <div className="container flex h-14 max-w-screen-2xl items-center">
//         <div className="mr-4 hidden md:flex">
//             <a className="mr-4 text-primary flex items-center space-x-2 lg:mr-6" href="/">
//                 <HandshakeIcon className="h-8 w-8" />
//                 <span className="hidden font-bold lg:inline-block">TPAccess</span>
//             </a>
//             <nav className="flex items-center gap-4 text-sm lg:gap-6">
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/docs">
//                     Docs
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground" href="/docs/components">
//                     Components
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/blocks">
//                     Blocks
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/charts">
//                     Charts
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/themes">
//                     Themes
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/examples">
//                     Examples
//                 </a>
//                 <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/colors">
//                     Colors
//                 </a>
//             </nav>
//         </div>
//     </div>
//     {/* <div className="text-primary flex items-center">
//         <p className="text-xl font-bold ml-2">Placement App</p>
//     </div> */}
//     <ModeToggle />
