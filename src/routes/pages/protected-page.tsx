import { useAuthContext } from "@/auth/hooks";
import { useLogoutMutation } from "../logout/queryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ProtectedPage = () => {
    const queryClient = useQueryClient();
    const { setIsAuthenticated } = useAuthContext();
    const navigate = useNavigate();

    const logoutMutation = useLogoutMutation({
        onSuccess: () => {
            setIsAuthenticated(false);
            queryClient.invalidateQueries({ queryKey: ["getUser"] });
            queryClient.setQueryData(["getUser"], null);
            navigate("/");
        },
    });
    return (
        <div>
            ProtectedPage: This is some kind of secret data. You have logged in that is why you can see this page.
            <div>
                <Button
                    onClick={() => {
                        logoutMutation.mutate();
                    }}
                >
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default ProtectedPage;
