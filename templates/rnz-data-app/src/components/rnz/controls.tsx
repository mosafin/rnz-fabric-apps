// RNZ component kit: filters, fields and tabs. Brand-managed.
// Every field has a visible label above it. Input borders are Ricoh Grey.

import { useId, useRef, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** A row of filters. Wraps on small screens. Put an optional "Clear filters" neutral button last. */
export function FilterBar({ children, label = "Filters" }: { children: ReactNode; label?: string }) {
    return (
        <div role="group" aria-label={label} className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-secondary p-4">
            {children}
        </div>
    );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    label: string;
    options: { value: string; label: string }[];
    help?: string;
    error?: string;
}

export function SelectField({ label, options, help, error, className, id, ...props }: SelectFieldProps) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const describedBy = [help && `${fieldId}-help`, error && `${fieldId}-err`].filter(Boolean).join(" ") || undefined;
    return (
        <div className={cn("flex min-w-48 flex-col gap-1.5", className)}>
            <label htmlFor={fieldId} className="text-[length:var(--text-300)] leading-[var(--leading-300)] font-bold text-foreground">
                {label}
            </label>
            <select
                id={fieldId}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(
                    "min-h-11 rounded-md border bg-background px-3 text-[length:var(--text-400)] text-foreground focus:border-primary",
                    error ? "border-destructive" : "border-input",
                )}
                {...props}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {help && (
                <span id={`${fieldId}-help`} className="text-[length:var(--text-300)] text-foreground">
                    {help}
                </span>
            )}
            {error && (
                <span id={`${fieldId}-err`} className="text-[length:var(--text-300)] font-bold text-destructive">
                    {error}
                </span>
            )}
        </div>
    );
}

export interface TabItem {
    id: string;
    label: string;
}

interface TabsProps {
    items: TabItem[];
    activeId: string;
    onChange: (id: string) => void;
    label: string;
    /** Render the panel for the active tab. */
    children: ReactNode;
}

/** WAI-ARIA tabs with arrow-key support. Active tab: red text, 3px accent underline. */
export function Tabs({ items, activeId, onChange, label, children }: TabsProps) {
    const baseId = useId();
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const onKey = (e: KeyboardEvent, i: number) => {
        let next = -1;
        if (e.key === "ArrowRight") next = (i + 1) % items.length;
        if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = items.length - 1;
        if (next >= 0) {
            e.preventDefault();
            onChange(items[next].id);
            refs.current[next]?.focus();
        }
    };
    return (
        <div>
            <div role="tablist" aria-label={label} className="flex overflow-x-auto border-b border-border">
                {items.map((t, i) => {
                    const selected = t.id === activeId;
                    return (
                        <button
                            key={t.id}
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            role="tab"
                            type="button"
                            id={`${baseId}-tab-${t.id}`}
                            aria-selected={selected}
                            aria-controls={`${baseId}-panel`}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => onChange(t.id)}
                            onKeyDown={(e) => onKey(e, i)}
                            className={cn(
                                "-mb-px min-h-11 whitespace-nowrap border-b-[3px] px-4 text-[length:var(--text-400)]",
                                selected
                                    ? "border-[color:var(--rnz-accent)] font-bold text-primary"
                                    : "border-transparent text-foreground hover:text-primary",
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
            <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${activeId}`} className="py-4">
                {children}
            </div>
        </div>
    );
}
