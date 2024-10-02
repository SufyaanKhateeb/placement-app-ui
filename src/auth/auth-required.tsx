import { useToast } from "@/hooks/use-toast";
import { PropsWithChildren, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useUserQuery } from "./queryHooks";
import RedirectingPlaceHolder from "@/components/ui/redirecting";
import Loading from "@/components/ui/loading";
import { useAuthContext } from "./hooks";

const AuthRequired = (props: PropsWithChildren) => {
    const { isAuthenticated } = useAuthContext();
    const fromUrl = useLoaderData() as string;
    const { toast } = useToast();
    const navigate = useNavigate();

    const { isLoading: isLoadingGetUser, isError: isErrorGetUser, error: errorGetUser } = useUserQuery();

    useEffect(() => {
        if (isErrorGetUser) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: errorGetUser.message || "",
            });
            const params = new URLSearchParams();
            params.set("from", fromUrl)
            navigate("/login?" + params.toString());
        }
    }, [isErrorGetUser, errorGetUser?.message, toast, navigate, fromUrl]);

    if (isLoadingGetUser) {
        return <Loading />;
    }

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
