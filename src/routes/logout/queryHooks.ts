import { api, isApiError } from "@/config/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const logoutUser = async () => {
    try {
        await api.delete("/auth/sessions/current");
    } catch (error) {
        if (isApiError(error) && error.response?.data) {
            if (error.response.status === 401) {
                throw new Error("Action not allowed. You are not logged in.");
            }
            if (error.response.status === 500) {
                throw new Error("Something went wrong. Please try again later.");
            }
            throw new Error(error.response.data.error);
        }
        throw error;
    }
};

export const useLogoutMutation = (customOptions: UseMutationOptions<void, Error, void, unknown> = {}) =>
    useMutation({
        mutationFn: logoutUser,
        ...customOptions,
    });
