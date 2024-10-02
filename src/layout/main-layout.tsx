import Header from "@/components/header";
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div className="flex flex-col h-screen w-screen">
            <Header />
            <div className="flex flex-1 w-full">
                <Outlet />
            </div>
            {/* <footer>monkey</footer> */}
        </div>
    );
};

export default Layout;