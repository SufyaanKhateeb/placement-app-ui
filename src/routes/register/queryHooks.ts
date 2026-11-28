import type { PasswordAuthResult } from "@/auth/email-verification";
import { api, isApiError } from "@/config/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

type registerUserDto = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

async function registerUser(user: registerUserDto) {
    try {
        return (await api.post<PasswordAuthResult | null>("/users", user)).data;
    } catch (error) {
        if (isApiError(error) && error.response?.data) {
            if (error.response.data.code === "invalid_request") {
                throw new Error(error.response.data.error || "Invalid details.");
            }
            if (error.response.data.code === "email_unavailable") {
                throw new Error("Account with email already exists.");
            }
            if (error.response.status === 500) {
                throw new Error("Something went wrong. Please try again later.");
            }
            throw new Error(error.response.data.error);
        }
        throw error;
    }
}

export const useRegisterMutation = (customOptions: UseMutationOptions<PasswordAuthResult | null, Error, registerUserDto, unknown> = {}) => useMutation({
    mutationFn: registerUser,
    ...customOptions,
})
