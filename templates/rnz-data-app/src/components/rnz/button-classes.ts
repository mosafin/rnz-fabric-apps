// RNZ component kit: button class recipes. Brand-managed (v12.1 Section 10).

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "neutral" | "onRed";

const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-6 py-2 " +
    "text-[length:var(--text-400)] leading-[var(--leading-300)] font-bold no-underline " +
    "transition-colors duration-150 cursor-pointer " +
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-foreground disabled:opacity-60 " +
    "aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-muted aria-disabled:text-foreground aria-disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
    // Red fill, white text. Pressed #A51022.
    primary:
        "border-2 border-primary bg-primary text-primary-foreground hover:border-primary-pressed hover:bg-primary-pressed hover:text-primary-foreground",
    // White, 2px red border, red text. Hover fills red.
    secondary:
        "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground",
    // White, 1px grey border, grey text. Cancel, back, low-priority actions.
    neutral:
        "border border-input bg-background text-foreground hover:bg-muted hover:text-foreground",
    // Only inside red bands.
    onRed:
        "border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
    return cn(base, variants[variant], className);
}
