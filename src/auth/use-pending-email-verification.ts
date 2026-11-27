import { useLocation, useNavigate } from "react-router-dom";
import type { PasswordAuthResult } from "./email-verification";

export function usePendingEmailVerification() {
    const { pathname, search, hash, state } = useLocation();
    const navigate = useNavigate();
    const pending = state?.emailVerification as PasswordAuthResult | undefined;

    function setPendingEmailVerification(verification?: PasswordAuthResult) {
        // Keep the screen in this history entry. The challenge itself remains in the HttpOnly cookie.
        navigate({ pathname, search, hash }, {
            replace: true,
            state: { ...state, emailVerification: verification },
            preventScrollReset: true,
        });
    }

    return [pending, setPendingEmailVerification] as const;
}
