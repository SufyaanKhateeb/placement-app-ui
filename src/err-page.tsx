import { ErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "./components/ui/button";

export default function ErrorPage() {
    const error = useRouteError() as ErrorResponse;

    return (
        <div className="w-full flex flex-col justify-center items-center bg-background">
            {!!error?.status && <h1 className="text-6xl font-bold mb-4">{error.status}</h1>}
            <h1 className="text-4xl mb-4">Oops!</h1>
            <p className="text-xl mb-8">Sorry, an unexpected error has occurred.</p>
            {!!error?.statusText && <p className="text-lg italic mb-8">{error.statusText}</p>}
            <a href="/">
                <Button>Go back to Home</Button>
            </a>
        </div>
    );
}
