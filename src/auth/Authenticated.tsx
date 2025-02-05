import { useGetUserQuery } from "./queryHooks";
import Loading from "@/components/ui/loading";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { setIsAuthenticated } from "./auth-actions";

function Authenticated() {
    const { isSuccess: isSuccessGetUser, isLoading, isFetching } = useGetUserQuery({ queryKey: ["getUser"], enabled: true });

    useEffect(() => {
        if (!isFetching && isSuccessGetUser) {
            setIsAuthenticated(true);
        }
    }, [isFetching, isSuccessGetUser]);

    if (isLoading) {
        return (
            <div>
                <Loading />;
            </div>
        );
    }

    return <Outlet />;
}

export default Authenticated;
