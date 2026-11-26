import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/config/axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestError } from "@/routes/forms/api";

export type PasswordAuthResult = {
    verificationRequired?: boolean;
    error?: string;
};

export function EmailVerification({ deliveryError, onComplete, onCancel }: {
    deliveryError?: string;
    onComplete: () => void;
    onCancel: () => void;
}) {
    const [code, setCode] = useState("");
    const [delivery, setDelivery] = useState(deliveryError);
    const confirm = useMutation({
        mutationFn: async (code: string) => axiosInstance.post("/auth/email-verification/confirm", { code }),
        onSuccess: onComplete,
    });
    const resend = useMutation({
        mutationFn: async () => (await axiosInstance.post<PasswordAuthResult>("/auth/email-verification/resend", {})).data,
        onSuccess: result => {
            setDelivery(result.error);
            setCode("");
        },
    });

    const error = confirm.isError ? requestError(confirm.error, "Could not verify the code.")
        : resend.isError ? requestError(resend.error, "Could not resend the code.")
        : delivery;
    const pending = confirm.isPending || resend.isPending;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        resend.reset();
        confirm.mutate(code);
    }

    return (
        <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
                <Label htmlFor="email-verification-code">Email verification code</Label>
                {!delivery && <p className="text-sm text-muted-foreground" role="status">
                    Check your email for a six-digit code.
                </p>}
                <Input id="email-verification-code" value={code} onChange={event => setCode(event.target.value)}
                    inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                    autoFocus required />
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" disabled={pending || code.length !== 6}>
                {confirm.isPending ? "Verifying…" : "Verify email"}
            </Button>
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" disabled={pending} onClick={() => {
                    confirm.reset();
                    resend.mutate();
                }}>{resend.isPending ? "Sending…" : "Resend code"}</Button>
                <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>Start over</Button>
            </div>
        </form>
    );
}
