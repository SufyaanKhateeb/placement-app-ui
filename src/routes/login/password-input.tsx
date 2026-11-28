import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
    function PasswordInput({ id, disabled, ...props }, ref) {
        const [visible, setVisible] = useState(false);
        return (
            <div className="relative">
                <Input {...props} ref={ref} id={id} disabled={disabled} type={visible ? "text" : "password"} className="pr-11" />
                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 size-8"
                    aria-controls={id} aria-label={visible ? "Hide password" : "Show password"}
                    disabled={disabled} onClick={() => setVisible(!visible)}>
                    {visible ? <EyeOff data-icon="inline-start" aria-hidden="true" /> : <Eye data-icon="inline-start" aria-hidden="true" />}
                </Button>
            </div>
        );
    },
);
