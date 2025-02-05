import { createBrowserRouter, LoaderFunctionArgs, RouterProvider } from "react-router-dom";
import "./App.css";
import ErrorPage from "./err-page";
import Layout from "./layout/main-layout";
import Root from "./routes/root";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoginPage } from "./routes/login/login";
import ProtectedPage from "./routes/pages/protected-page";
import { Toaster } from "./components/ui/toaster";
import { RegisterPage } from "./routes/register/register";
import Authenticated from "./auth/Authenticated";
import AuthRequired from "./auth/auth-required";
import NotAuthRequired from "./auth/not-auth-required";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const queryClient = new QueryClient();

// initialize and register GSAP plugin
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        Component: Layout,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                Component: Root,
            },
            {
                path: "/error",
                element: <ErrorPage />,
            },
            {
                id: "authentication-checked-routes",
                Component: Authenticated,
                errorElement: <ErrorPage />,
                children: [
                    {
                        path: "login",
                        element: notAuthenticatedRequired(<LoginPage />),
                    },
                    {
                        path: "register",
                        element: notAuthenticatedRequired(<RegisterPage />),
                    },
                    {
                        path: "protected",
                        element: authenticatedRequired(<ProtectedPage />),
                        loader: authLoader,
                    },
                ],
            },
        ],
    },
]);

function authenticatedRequired(el: JSX.Element) {
    return <AuthRequired>{el}</AuthRequired>;
}

function notAuthenticatedRequired(el: JSX.Element) {
    return <NotAuthRequired>{el}</NotAuthRequired>;
}

async function authLoader({ request }: LoaderFunctionArgs) {
    return new URL(request.url).pathname;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools />
            <RouterProvider router={router} />
            <Toaster />
        </QueryClientProvider>
    );
}

export default App;
