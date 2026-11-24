import { Circle, CircleCheck, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "./api";

const statusDisplay = {
    not_submitted: { label: "Not submitted", icon: Circle, variant: "outline" },
    submitted: { label: "Awaiting review", icon: Clock, variant: "secondary" },
    changes_requested: { label: "Changes requested", icon: MessageSquare, variant: "destructive" },
    approved: { label: "Approved", icon: CircleCheck, variant: "default" },
} as const;

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
    const { label, icon: Icon, variant } = statusDisplay[status];
    return (
        <Badge variant={variant} className="shrink-0 gap-1.5 whitespace-nowrap">
            <Icon className="size-3" aria-hidden="true" />
            {label}
        </Badge>
    );
}
