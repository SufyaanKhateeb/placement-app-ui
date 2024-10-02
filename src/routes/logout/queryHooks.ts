import { axiosInstance } from "@/config/axios";
import axios from "axios";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const logoutUser = async () => {
    try {
        await axiosInstance.post("/logout");
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            if ((error.response.data.error as string).startsWith("invalid payload")) {
                throw new Error("Invalid details.");
            }
            if (error.response.data.error === "invalid user, user not found") {
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
