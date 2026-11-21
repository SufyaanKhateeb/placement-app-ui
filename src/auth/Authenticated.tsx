import { useGetUserQuery } from "./queryHooks";
import Loading from "@/components/ui/loading";
import { Outlet } from "react-router-dom";

function Authenticated() {
    const { isPending } = useGetUserQuery({ queryKey: ["getUser"] });

    if (isPending) {
        return (
            <div>
                <Loading />
            </div>
        );
    }

    return <Outlet />;
}

export default Authenticated;