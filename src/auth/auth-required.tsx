import { useToast } from "@/hooks/use-toast";
import { PropsWithChildren, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useGetUserQuery } from "./queryHooks";
import RedirectingPlaceHolder from "@/components/ui/redirecting";
import Loading from "@/components/ui/loading";
import { useAuthStore } from "./auth-store";

const AuthRequired = (props: PropsWithChildren) => {
    const isAuthenticated = useAuthStore((store) => store.isAuthenticated);
    const fromUrl = useLoaderData() as string;
    const { toast } = useToast();
    const navigate = useNavigate();

    const { isError: isErrorGetUser, error: errorGetUser, isFetching } = useGetUserQuery({ queryKey: ["getUser"] });

    useEffect(() => {
        if (!isFetching && isErrorGetUser) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: errorGetUser.message || "",
            });
            const params = new URLSearchParams();
            params.set("from", fromUrl);
            navigate("/login?" + params.toString());
        }
    }, [isFetching, isErrorGetUser, errorGetUser?.message, toast, navigate, fromUrl]);

    if (isErrorGetUser) {
        return <RedirectingPlaceHolder />;
    }

    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <Loading />
            </div>
        );
    }

    return props.children;
};

export default AuthRequired;
