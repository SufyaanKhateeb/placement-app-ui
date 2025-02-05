import { useGetUserQuery } from "@/auth/queryHooks";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLogoutMutation } from "@/routes/logout/queryHooks";
import { setIsAuthenticated } from "@/auth/auth-actions";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const ProfileButton = () => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user } = useGetUserQuery({ queryKey: ["getUser"], enabled: false });
    const logoutMutation = useLogoutMutation({
        onSuccess: () => {
            setIsAuthenticated(false);
            queryClient.invalidateQueries({ queryKey: ["getUser"] });
            queryClient.setQueryData(["getUser"], null);
            navigate("/");
        },
    });

    return (
        !!user && (
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Avatar className="ml-2 h-8 w-8 hover:scale-110 cursor-pointer">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>{user.firstName[0] + user.lastName[0]}</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-1">
                    <DropdownMenuGroup>
                        <DropdownMenuItem>View profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logoutMutation.mutate()}>Logout</DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    );
};

export default ProfileButton;
