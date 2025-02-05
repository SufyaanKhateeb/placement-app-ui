import { PropsWithChildren, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetUserQuery } from "./queryHooks";
import RedirectingPlaceHolder from "@/components/ui/redirecting";
import { useAuthStore } from "./auth-store";

const NotAuthRequired = (props: PropsWithChildren) => {
    const isAuthenticated = useAuthStore(store => store.isAuthenticated);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = params.get("from") || "/";
    const navigate = useNavigate();

    const { isSuccess: isSuccessGetUser } = useGetUserQuery({ queryKey: ["getUser"] });

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from);
        }
    }, [isAuthenticated, navigate, from]);

    if (isSuccessGetUser || isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <RedirectingPlaceHolder />
            </div>
        );
    }

    return props.children;
};

export default NotAuthRequired;
