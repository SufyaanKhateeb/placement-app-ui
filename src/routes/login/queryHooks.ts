import type { PasswordAuthResult } from "@/auth/email-verification";
import { api, isApiError } from "@/config/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

type loginUserDto = {
    email: string;
    password: string;
};

const loginUser = async (user: loginUserDto, admin: boolean) => {
    try {
        const response = await api.post<PasswordAuthResult>("/auth/sessions", { ...user, mode: admin ? "admin" : "user" });
        return response.status === 204 ? null : response.data;
    } catch (error) {
        if (isApiError(error) && error.response?.data) {
            if (error.response.data.code === "invalid_request") {
                throw new Error(error.response.data.error || "Invalid details.");
            }
            if (error.response.data.code === "invalid_credentials") {
                throw new Error("Invalid email or password.");
            }
            if (error.response.status === 500) {
                throw new Error("Something went wrong. Please try again later.");
            }
            throw new Error(error.response.data.error);
        }
        throw error;
    }
};

export const useLoginMutation = (customOptions: UseMutationOptions<PasswordAuthResult | null, Error, loginUserDto, unknown> = {}, admin = false) =>
    useMutation({
        mutationFn: user => loginUser(user, admin),
        ...customOptions,
    });
