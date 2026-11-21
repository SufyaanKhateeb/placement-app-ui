import { axiosInstance } from "@/config/axios";
import axios from "axios";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

type loginUserDto = {
    email: string;
    password: string;
};

const loginUser = async (user: loginUserDto, admin: boolean) => {
    try {
        await axiosInstance.post(admin ? "/login-admin" : "/login", user);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            if ((error.response.data.error as string).startsWith("invalid payload")) {
                throw new Error("Invalid details.");
            }
            if (error.response.data.error === "not found, invalid email or password") {
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

export const useLoginMutation = (customOptions: UseMutationOptions<void, Error, loginUserDto, unknown> = {}, admin = false) =>
    useMutation({
        mutationFn: user => loginUser(user, admin),
        ...customOptions,
    });
