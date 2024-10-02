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
import AuthRequired from "./auth/auth-required";
import NotAuthRequired from "./auth/not-auth-required";
import { WithAuthData } from "./auth/with-auth-data";

const queryClient = new QueryClient();

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
        ],
    },
    {
        id: "authenticated-routes",
        Component: WithAuthData,
        path: "/",
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
    {
        path: "/error",
        element: <ErrorPage />,
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
