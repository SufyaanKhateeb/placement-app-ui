import type { PropsWithChildren } from "react";
import { Navigate, useLoaderData } from "react-router-dom";
import Loading from "@/components/ui/loading";
import { useGetUserQuery } from "./queryHooks";

export default function AuthRequired({ children }: PropsWithChildren) {
    const from = useLoaderData() as string;
    const { data: user, isPending, isFetching } = useGetUserQuery({ queryKey: ["getUser"] });

    if (user) return children;
    if (isPending || isFetching) {
        return <div className="flex w-full flex-1 items-center justify-center"><Loading /></div>;
    }

    const search = new URLSearchParams({ from });
    return <Navigate to={"/login?" + search.toString()} replace />;
}
