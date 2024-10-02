import { Icons } from "./icons";
import { Link } from "react-router-dom";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-8xl items-center">
                <MainNav />
                <MobileNav />
                <div className="flex flex-1 items-center justify-end space-x-2 md:justify-end">
                    <nav className="flex items-center">
                        <Link to={'/college-github'} target="_blank" rel="noreferrer">
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
                        <Link to={'college-twitter'} target="_blank" rel="noreferrer">
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
