import { axiosInstance } from "@/config/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";

const profileSchema = z.object({
    email: z.string(),
    firstName: z.string(),
    id: z.number().int().positive(),
    lastName: z.string(),
    role: z.enum(["user", "admin"]).optional(),
    uType: z.enum(["student", "user", "admin"]).optional(),
    verified: z.boolean(),
}).transform(({ role, uType, ...profile }) => ({
    ...profile,
    role: role ?? (uType === "admin" ? "admin" as const : "user" as const),
}));

type User = z.output<typeof profileSchema>;

async function getUser(): Promise<User> {
    await axiosInstance.post("/refresh", {});
    const response = await axiosInstance.get<unknown>("/user");
    const profile = profileSchema.safeParse(response.data);
    if (!profile.success) {
        throw new Error("The session did not return a valid user profile.");
    }
    return profile.data;
}

export const useGetUserQuery = (customOptions: UseQueryOptions<User, Error>) =>
    useQuery<User, Error>({
        queryFn: getUser,
        enabled: false,
        retry: false,
        refetchOnWindowFocus: true,
        ...customOptions,
    });
