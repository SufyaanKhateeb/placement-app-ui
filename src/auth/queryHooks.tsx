import { axiosInstance } from "@/config/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

type User = {
    email: string;
    firstName: string;
    id: number;
    lastName: string;
    uType: string;
    verified: boolean;
};

async function getUser() {
    try {
        await axiosInstance.post("/refresh", {});
        const res = await axiosInstance.get("/user");
        return res.data;
    } catch (error) {
        console.log(error);
        throw new Error("Not authorized. Please login or register");
    }
}

export const useGetUserQuery = (customOptions: UseQueryOptions<User, Error>) =>
    useQuery<User, Error>({
        queryFn: getUser,
        enabled: false,
        retry: false,
        refetchOnWindowFocus: true,
        ...customOptions,
    });
