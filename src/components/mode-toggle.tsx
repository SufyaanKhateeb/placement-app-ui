import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle theme">
                    <Sun data-icon="inline-start" aria-hidden="true" className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon data-icon="inline-start" aria-hidden="true" className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => setTheme("light")}>Light</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTheme("dark")}>Dark</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setTheme("system")}>System</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
