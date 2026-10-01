// RNZ component kit: page header, cards, KPI cards, tags. Brand-managed.
// No eyebrow labels above headings. Metadata sits BELOW the title as plain text.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    /** One or two plain sentences on what the screen is for. */
    description?: string;
    /** Small metadata below the description, e.g. "Data refreshed 2 Oct 2026". */
    meta?: ReactNode;
    /** At most one primary action plus secondary or neutral actions. */
    actions?: ReactNode;
}

export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
    return (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-[72ch]">
                <h1 className="font-page-title text-[length:var(--text-hero-700)] leading-[var(--leading-hero-700)] font-bold text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="font-page-subtitle mt-2 text-[length:var(--text-400)] leading-[var(--leading-400)] font-light text-foreground">
                        {description}
                    </p>
                )}
                {meta && <div className="mt-2 text-[length:var(--text-200)] leading-[var(--leading-200)] text-foreground">{meta}</div>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Optional title rendered as an h2. */
    title?: string;
    /** Plain-text metadata or helper line below the title. */
    subtitle?: string;
    /** 4px top accent in red, or the pillar colour when inside a pillar AppShell. */
    accent?: boolean;
    /** Optional action rendered top-right (one link or a neutral button). */
    action?: ReactNode;
    headingLevel?: 2 | 3;
}

export function Card({ title, subtitle, accent, action, headingLevel = 2, className, children, ...props }: CardProps) {
    const Heading = headingLevel === 2 ? "h2" : "h3";
    return (
        <section
            className={cn(
                "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2",
                accent && "border-t-4 border-t-[color:var(--rnz-accent)]",
                className,
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {title && (
                            <Heading className="font-visual-title text-[length:var(--text-500)] leading-[var(--leading-500)] font-bold text-foreground">
                                {title}
                            </Heading>
                        )}
                        {subtitle && (
                            <p className="font-visual-subtitle mt-1 text-[length:var(--text-300)] leading-[var(--leading-300)] text-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

interface KpiCardProps {
    /** Pre-formatted value using the semantic model's format string. */
    value: string;
    label: string;
    /** Optional context line, e.g. "vs last month". Plain text, no arrows coloured alone. */
    context?: string;
    accent?: boolean;
}

/** Value first, label below (matches the Fabric card visual rule). */
export function KpiCard({ value, label, context, accent }: KpiCardProps) {
    return (
        <div
            className={cn(
                "flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-6 shadow-2",
                accent && "border-t-4 border-t-[color:var(--rnz-accent)]",
            )}
        >
            <span className="truncate font-numeric text-[length:var(--text-hero-800)] leading-[var(--leading-hero-800)] font-bold text-primary tabular-nums">
                {value}
            </span>
            <span className="text-[length:var(--text-300)] leading-[var(--leading-300)] text-foreground">{label}</span>
            {context && <span className="text-[length:var(--text-200)] leading-[var(--leading-200)] text-foreground">{context}</span>}
        </div>
    );
}

interface TagProps {
    children: ReactNode;
    tone?: "default" | "red";
}

/** Categories only, never decoration. Sentence case, outline, no fill. */
export function Tag({ children, tone = "default" }: TagProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-[length:var(--text-300)] leading-[var(--leading-200)]",
                tone === "red" ? "border-primary text-primary" : "border-input text-foreground",
            )}
        >
            {children}
        </span>
    );
}
