import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetUserQuery } from "./queryHooks";
import { userSignInDestination } from "./sign-in-destination";

export default function NotAuthRequired({ children }: PropsWithChildren) {
    const { data: user } = useGetUserQuery({ queryKey: ["getUser"] });
    const { search } = useLocation();
    if (user) return <Navigate to={userSignInDestination(search)} replace />;
    return children;
}
