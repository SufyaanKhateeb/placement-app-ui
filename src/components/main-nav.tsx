import { Link } from "react-router-dom";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function MainNav({ compact = false }: { compact?: boolean }) {
    return (
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <Icons.logo aria-hidden="true" className="size-6 shrink-0 text-primary" />
            <span className="truncate">{compact ? "Placement App" : siteConfig.name}</span>
        </Link>
    );
}
