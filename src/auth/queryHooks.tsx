import { isApiError, requestEffect } from "@/config/api";
import { Effect } from "effect";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";

const profileSchema = z.object({
    email: z.string(),
    firstName: z.string(),
    id: z.number().int().positive(),
    lastName: z.string(),
    permissions: z.array(z.string()).default([]),
    role: z.enum(["user", "admin"]).optional(),
    accountType: z.enum(["user", "admin"]).optional(),
    uType: z.enum(["student", "user", "admin"]).optional(),
    verified: z.boolean(),
}).transform(({ role, accountType, uType, ...profile }) => ({
    ...profile,
    role: role ?? (uType === "admin" ? "admin" as const : "user" as const),
    accountType: accountType ?? role ?? (uType === "admin" ? "admin" as const : "user" as const),
}));

type User = z.output<typeof profileSchema>;

const readSession = Effect.gen(function* () {
    yield* requestEffect({ method: "post", url: "/auth/sessions/current/renewals", body: {} });
    const response = yield* requestEffect({ method: "get", url: "/users/me" });
    const profile = profileSchema.safeParse(response.data);
    if (!profile.success) {
        return yield* Effect.fail(new Error("The session did not return a valid user profile."));
    }
    return profile.data;
}).pipe(Effect.catch(error =>
    isApiError(error) && error.response.status === 401 ? Effect.succeed(null) : Effect.fail(error),
));

export const useGetUserQuery = (customOptions: UseQueryOptions<User | null, Error>) =>
    useQuery<User | null, Error>({
        queryFn: ({ signal }) => Effect.runPromise(readSession, { signal }),
        enabled: false,
        retry: false,
        refetchOnWindowFocus: true,
        ...customOptions,
    });
