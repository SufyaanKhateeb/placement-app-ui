import { AuthProvider } from "./context";
import { useUserQuery } from "./queryHooks";
import Loading from "@/components/ui/loading";
import { useEffect } from "react";
import { useAuthContext } from "./hooks";
import Layout from "@/layout/main-layout";

function AuthData() {
    const { setIsAuthenticated } = useAuthContext();

    const { isSuccess: isSuccessGetUser, isFetching: isFetchingGetUser } = useUserQuery({ enabled: true });

    useEffect(() => {
        if (isSuccessGetUser) {
            setIsAuthenticated(true);
        }

        return () => {
            setIsAuthenticated(false);
        };
    }, [isSuccessGetUser, setIsAuthenticated]);

    if (isFetchingGetUser) {
        return (
            <div>
                here in loading
                <Loading />;
            </div>
        );
    }

    return <Layout />;
}

export function WithAuthData() {
    return (
        <AuthProvider>
            <AuthData />
        </AuthProvider>
    );
}
