import { setIsAuthenticated } from "@/auth/auth-actions";
import { useGetUserQuery } from "@/auth/queryHooks";
import Header from "@/components/header";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
    const { data: user, isPending } = useGetUserQuery({ queryKey: ["getUser"], enabled: true });

    useEffect(() => {
        if (!isPending) {
            setIsAuthenticated(Boolean(user));
        }
    }, [isPending, user]);

    return (
        <div className="main-layout-container flex flex-col h-screen max-w-screen overflow-auto">
            <Header />
            <div className="flex flex-1 flex-col mt-6 w-full h-full">
                <Outlet />
            </div>
            {/* <footer>monkey</footer> */}
        </div>
    );
};

export default Layout;