import { createContext, PropsWithChildren, useState } from "react";

type AuthContextType = {
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    isAuthorized: boolean;
    setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated: setIsAuthenticated, isAuthorized, setIsAuthorized }}>
            {children}
        </AuthContext.Provider>
    );
}
