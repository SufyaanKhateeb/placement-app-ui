import type { PasswordAuthResult } from "@/auth/email-verification";
import { axiosInstance } from "@/config/axios";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";

type registerUserDto = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

async function registerUser(user: registerUserDto) {
    try {
        return (await axiosInstance.post<PasswordAuthResult | null>("/register", user)).data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            if ((error.response.data.error as string).startsWith("invalid payload")) {
                throw new Error("Invalid details.");
            }
            if (error.response.data.error === `user with email ${user.email} already exists`) {
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
