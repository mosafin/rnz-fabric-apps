// RNZ component kit: app shell. Brand-managed (v12.1 Section 12).
// White header, master logo on the left, 1px border. Active nav item red with a
// 3px underline. Side nav on #F5F5F5. No dark sidebars, no dark headers.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Pillar = "workplace" | "workflow" | "cloud" | "cyber" | "print";

interface AppShellProps {
    /** App name shown in the header, e.g. "Content Shelf Mark". */
    appName: string;
    /**
     * Path to the MASTER RICOH logo file (e.g. "/brand/ricoh-logo.svg").
     * Never type, draw or rebuild the logo. If no file is supplied, no logo shows.
     */
    logoSrc?: string;
    /** Sets the pillar accent for every component inside. Omit on general apps. */
    pillar?: Pillar;
    /** Primary navigation, usually <NavTabs />. */
    nav?: ReactNode;
    /** Header actions on the right (neutral or secondary buttons, filters chips). */
    actions?: ReactNode;
    /** Optional side navigation, usually <SideNav />. */
    sideNav?: ReactNode;
    children: ReactNode;
}

export function AppShell({ appName, logoSrc, pillar, nav, actions, sideNav, children }: AppShellProps) {
    return (
        <div className={cn("flex min-h-full flex-col bg-background text-foreground", pillar && `pillar-${pillar}`)}>
            <a
                href="#rnz-main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:p-2"
            >
                Skip to content
            </a>
            <header className="sticky top-0 z-20 border-b border-border bg-background">
                <div className="mx-auto flex min-h-14 w-full max-w-[1160px] flex-wrap items-center gap-x-6 gap-y-1 px-4 pt-2 md:px-8 md:py-0">
                    <div className="flex items-center gap-4">
                        {logoSrc && <img src={logoSrc} alt="RICOH" className="h-6 w-auto" />}
                        <span className="text-[length:var(--text-500)] leading-[var(--leading-500)] font-bold text-foreground">
                            {appName}
                        </span>
                    </div>
                    {actions && <div className="ml-auto flex flex-wrap items-center gap-2 md:order-last">{actions}</div>}
                    {nav && <div className="order-last flex w-full min-w-0 self-stretch md:order-none md:w-auto md:flex-1">{nav}</div>}
                </div>
            </header>
            <div className="mx-auto flex w-full max-w-[1160px] flex-1 flex-col md:flex-row">
                {sideNav && (
                    <aside className="border-b border-border bg-secondary p-4 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
                        {sideNav}
                    </aside>
                )}
                <main id="rnz-main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export interface NavItem {
    id: string;
    label: string;
    href?: string;
}

interface NavTabsProps {
    items: NavItem[];
    activeId: string;
    onSelect?: (id: string) => void;
    label?: string;
}

/** Top navigation. Active item is red with a 3px red underline. */
export function NavTabs({ items, activeId, onSelect, label = "Main" }: NavTabsProps) {
    return (
        <nav aria-label={label} className="flex min-w-0 overflow-x-auto">
            <ul role="list" className="flex gap-4">
                {items.map((item) => {
                    const active = item.id === activeId;
                    return (
                        <li key={item.id} className="flex">
                            <a
                                href={item.href ?? `#${item.id}`}
                                aria-current={active ? "page" : undefined}
                                onClick={(e) => {
                                    if (onSelect) {
                                        e.preventDefault();
                                        onSelect(item.id);
                                    }
                                }}
                                className={cn(
                                    "flex min-h-11 items-center whitespace-nowrap border-b-[3px] text-[length:var(--text-300)] no-underline hover:text-primary",
                                    active
                                        ? "border-primary font-bold text-primary"
                                        : "border-transparent text-foreground",
                                )}
                            >
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/** Side navigation on the light surface. Active item has a white fill and red left bar. */
export function SideNav({ items, activeId, onSelect, label = "Section" }: NavTabsProps) {
    return (
        <nav aria-label={label}>
            <ul role="list" className="flex flex-col gap-1">
                {items.map((item) => {
                    const active = item.id === activeId;
                    return (
                        <li key={item.id}>
                            <a
                                href={item.href ?? `#${item.id}`}
                                aria-current={active ? "page" : undefined}
                                onClick={(e) => {
                                    if (onSelect) {
                                        e.preventDefault();
                                        onSelect(item.id);
                                    }
                                }}
                                className={cn(
                                    "flex min-h-11 items-center rounded-md border-l-[3px] px-3 text-[length:var(--text-300)] no-underline",
                                    active
                                        ? "border-primary bg-background font-bold text-primary"
                                        : "border-transparent text-foreground hover:bg-background",
                                )}
                            >
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
