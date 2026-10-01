// RNZ component kit: status messages and async states. Brand-managed.
// Meaning is carried by icon + text. The 4px bar only supports it.
// Always on white. Never pastel-filled boxes (grey text fails contrast on them).

import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "error" | "success" | "warning" | "info";

const toneBar: Record<StatusTone, string> = {
    error: "border-l-destructive",
    success: "border-l-success",
    warning: "border-l-warning",
    info: "border-l-info",
};

const toneIcon = {
    error: CircleAlert,
    success: CircleCheck,
    warning: TriangleAlert,
    info: Info,
} as const;

interface StatusMessageProps {
    tone: StatusTone;
    title: string;
    children?: ReactNode;
    action?: ReactNode;
}

export function StatusMessage({ tone, title, children, action }: StatusMessageProps) {
    const Icon = toneIcon[tone];
    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={cn(
                "flex max-w-[640px] items-start gap-3 rounded-md border border-border border-l-4 bg-background px-4 py-3 text-[length:var(--text-300)] leading-[var(--leading-300)] text-foreground",
                toneBar[tone],
            )}
        >
            <Icon aria-hidden="true" className={cn("mt-0.5 shrink-0 icon-size-300", tone === "error" ? "text-destructive" : "text-foreground")} />
            <div className="min-w-0 flex-1">
                <strong className="font-bold">{title}</strong>
                {children && <span> {children}</span>}
                {action && <div className="mt-2">{action}</div>}
            </div>
        </div>
    );
}

/** Loading: a skeleton matching the shape of the expected content. */
export function LoadingSkeleton({ rows = 3, className, label = "Loading" }: { rows?: number; className?: string; label?: string }) {
    return (
        <div role="status" aria-label={label} className={cn("flex flex-col gap-3", className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className={cn("h-4 animate-pulse rounded-md bg-border", i === rows - 1 ? "w-2/3" : "w-full")}
                />
            ))}
        </div>
    );
}

interface EmptyStateProps {
    title: string;
    /** Say why it's empty and what to do next. Plain NZ English. */
    description?: string;
    action?: ReactNode;
}

/** Empty: centred message explaining that no data is available. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <Inbox aria-hidden="true" className="icon-size-700 text-foreground" />
            <p className="text-[length:var(--text-500)] leading-[var(--leading-500)] font-bold text-foreground">{title}</p>
            {description && (
                <p className="max-w-[56ch] text-[length:var(--text-300)] leading-[var(--leading-300)] text-foreground">{description}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/** Error: a status message with the real error text. Never replace with mock data. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <StatusMessage
            tone="error"
            title="We couldn't load this data."
            action={
                onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="min-h-11 rounded-md border border-input bg-background px-4 font-bold text-foreground hover:bg-muted"
                    >
                        Try again
                    </button>
                ) : undefined
            }
        >
            {message}
        </StatusMessage>
    );
}
