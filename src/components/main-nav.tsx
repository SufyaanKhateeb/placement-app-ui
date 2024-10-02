import { siteConfig } from "@/config/site";
// import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import {
    Link,
    // useLocation
} from "react-router-dom";

export function MainNav() {
    // const { pathname } = useLocation();

    return (
        <div className="mr-4 py-4 hidden md:flex">
            <Link to="/" className="mr-4 text-primary flex items-center space-x-2 lg:mr-6">
                <Icons.logo className="h-6 w-6" />
                <span className="hidden font-bold md:inline-block">{siteConfig.name}</span>
            </Link>
            {/* <nav className="flex items-center gap-4 text-sm lg:gap-6">
        <Link
          to="/docs"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/docs" ? "text-foreground" : "text-foreground/60"
          )}
        >
          Docs
        </Link>
        <Link
          to="/docs/components"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/docs/components") &&
              !pathname?.startsWith("/docs/component/chart")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Components
        </Link>
      </nav> */}
        </div>
    );
}
