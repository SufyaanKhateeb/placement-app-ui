import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetUserQuery } from "./queryHooks";
import { userSignInDestination } from "./sign-in-destination";

export default function NotAuthRequired({ children }: PropsWithChildren) {
    const { data: user } = useGetUserQuery({ queryKey: ["getUser"] });
    const { search } = useLocation();
    const destination = userSignInDestination(search);
    if (user && destination !== "/admin/invitation") return <Navigate to={destination} replace />;
    return children;
}
