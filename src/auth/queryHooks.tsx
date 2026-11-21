import { axiosInstance } from "@/config/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

type User = {
    email: string;
    firstName: string;
    id: number;
    lastName: string;
    role: "user" | "admin";
    verified: boolean;
};

type UserResponse = Omit<User, "role"> & {
    role?: User["role"];
    uType?: "student" | User["role"];
};

async function getUser(): Promise<User> {
    try {
        await axiosInstance.post("/refresh", {});
        const res = await axiosInstance.get<UserResponse>("/user");
        const { role, uType, ...profile } = res.data;
        return { ...profile, role: role ?? (uType === "admin" ? "admin" : "user") };
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
