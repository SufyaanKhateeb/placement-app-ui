import { axiosInstance } from "@/config/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

async function getUser() {
    try {
        await axiosInstance.post("/refresh", {});
        const res = await axiosInstance.get("/user");
        return res.data;
    } catch (error) {
        console.log(error)
        throw new Error("Not authorized. Please login or register")
    }
}

type CustomQueryOptions = Omit<UseQueryOptions, "queryKey" | "someOtherField">;

export const useUserQuery = (customOptions: CustomQueryOptions = {}) =>
    useQuery({
        queryKey: ["getUser"],
        queryFn: getUser,
        enabled: false,
        retry: false,
        refetchOnWindowFocus: false,
        ...customOptions,
    });
