import { PropsWithChildren, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserQuery } from "./queryHooks";
import RedirectingPlaceHolder from "@/components/ui/redirecting";
import Loading from "@/components/ui/loading";
import { useAuthContext } from "./hooks";

const NotAuthRequired = (props: PropsWithChildren) => {
    const { isAuthenticated } = useAuthContext();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const from = params.get("from") || "/";
    const navigate = useNavigate();

    const { isSuccess: isSuccessGetUser, isLoading: isLoadingGetUser } = useUserQuery();

    useEffect(() => {
        if (isAuthenticated || isSuccessGetUser) {
            navigate(from);
        }
    }, [isAuthenticated, isSuccessGetUser, navigate, from]);

    if (isLoadingGetUser) {
        return <Loading />;
    }

    if (isSuccessGetUser) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <RedirectingPlaceHolder />
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <Loading />
            </div>
        );
    }

    return props.children;
};

export default NotAuthRequired;
