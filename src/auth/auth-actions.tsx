import { AuthStoreState, useAuthStore } from "./auth-store";
import { produce } from "immer";

// if there is a complex nested object in which you want to update only some properties
// you can use immer's produce function like this
// export const updateNestedObject = (value) =>
//     useStore.setState(
//         produce<StoreState>((store) => {
//             store.nestedObject.property = isAuthorized;
//         })
//     );

export const setIsAuthenticated = (isAuthenticated: boolean) =>
    useAuthStore.setState(
        produce<AuthStoreState>((store) => {
            store.isAuthenticated = isAuthenticated;
        })
    );

export const setIsAuthorized = (isAuthorized: boolean) =>
    useAuthStore.setState(
        produce<AuthStoreState>((store) => {
            store.isAuthorized = isAuthorized;
        })
    );
