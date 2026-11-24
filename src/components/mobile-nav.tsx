import { MenuIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

export function MobileNav({ links }: { links: { to: string; label: string; end?: boolean }[] }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation" className="shrink-0 md:hidden">
                    <MenuIcon data-icon="inline-start" aria-hidden="true" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="motion-reduce:animate-none motion-reduce:transition-none">
                <SheetTitle>Navigation</SheetTitle>
                <nav aria-label="Main navigation" className="mt-4 flex flex-col gap-1">
                    <SheetClose asChild>
                        <Button variant="ghost" asChild className="justify-start aria-[current=page]:bg-accent">
                            <NavLink to="/" end>Home</NavLink>
                        </Button>
                    </SheetClose>
                    {links.map(({ to, label, end }) => (
                        <SheetClose key={to} asChild>
                            <Button variant="ghost" asChild className="justify-start aria-[current=page]:bg-accent">
                                <NavLink to={to} end={end}>{label}</NavLink>
                            </Button>
                        </SheetClose>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
