import { axiosInstance } from "@/config/axios";
import axios from "axios";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const logoutUser = async () => {
    try {
        await axiosInstance.delete("/auth/sessions/current");
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
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
