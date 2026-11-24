import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { useGetUserQuery } from "@/auth/queryHooks";
import { useLogoutMutation } from "@/routes/logout/queryHooks";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function ProfileButton() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: user } = useGetUserQuery({ queryKey: ["getUser"] });
    const logout = useLogoutMutation({
        onSuccess: async () => {
            await queryClient.cancelQueries({ queryKey: ["getUser"] });
            setIsAuthenticated(false);
            queryClient.setQueryData(["getUser"], null);
            queryClient.removeQueries({ queryKey: ["adminForm"] });
            queryClient.removeQueries({ queryKey: ["adminForms"] });
            queryClient.removeQueries({ queryKey: ["publishedForms"] });
            queryClient.removeQueries({ queryKey: ["adminSubmissions"] });
            navigate("/", { replace: true });
        },
    });

    if (!user) return null;

    const initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                    <Avatar className="size-8"><AvatarFallback>{initials || "?"}</AvatarFallback></Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel className="max-w-64 truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild><Link to="/forms">Forms</Link></DropdownMenuItem>
                    {user.role === "admin" && (
                        <>
                            <DropdownMenuItem asChild><Link to="/admin/forms">Manage forms</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link to="/admin">Admin account</Link></DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>Sign out</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
