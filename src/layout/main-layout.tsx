import Header from "@/components/header";
import { Outlet } from "react-router-dom";

const Layout = () => {
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