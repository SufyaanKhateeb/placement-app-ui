import { create } from "zustand";

export interface AuthStoreState {
    isAuthenticated: boolean;
    isAuthorized: boolean;
}
export const initialState: AuthStoreState = {
    isAuthenticated: false,
    isAuthorized: false,
};

export const useAuthStore = create<AuthStoreState>(() => ({
    ...initialState,
}));