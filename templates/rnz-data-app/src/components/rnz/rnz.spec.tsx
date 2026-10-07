import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import App from "@/App";
import { AppShell, Button, Tabs, StatusMessage, KpiCard, RICOH_LOCKUP_ALT, RICOH_LOCKUP_SRC } from "@/components/rnz";
import { useAppTheme } from "@/hooks/use-theme";
import { useState } from "react";

describe("RNZ brand layer", () => {
    it("renders the app inside the RNZ shell with one h1", () => {
        render(<App />);
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("always shows the RICOH lock-up (logo with tagline) in the header", () => {
        render(<App />);
        const logo = screen.getByAltText(RICOH_LOCKUP_ALT);
        expect(logo).toHaveAttribute("src", "/brand/RICOH-Logo_sRGB_full-colour.png");
        expect(logo).toHaveAttribute("height", "40");
    });

    it("ignores any other logo file passed to AppShell", () => {
        render(<AppShell appName="Test" logoSrc="/brand/some-other-logo.svg">x</AppShell>);
        const imgs = screen.getAllByRole("img");
        expect(imgs).toHaveLength(1);
        expect(imgs[0]).toHaveAttribute("src", RICOH_LOCKUP_SRC);
    });

    it("keeps the app light even when a host adds .dark", async () => {
        document.documentElement.classList.add("dark");
        const { result } = renderHook(() => useAppTheme());
        expect(result.current.isDark).toBe(false);
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        document.documentElement.classList.add("dark");
        await new Promise((r) => setTimeout(r, 0));
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("gives buttons a 44px minimum and a real type", () => {
        render(<Button>Log 3 requests</Button>);
        const btn = screen.getByRole("button", { name: "Log 3 requests" });
        expect(btn.className).toContain("min-h-11");
        expect(btn).toHaveAttribute("type", "button");
    });

    it("carries status meaning in text, with alert role for errors", () => {
        render(<StatusMessage tone="error" title="We couldn't send your request." />);
        expect(screen.getByRole("alert")).toHaveTextContent("We couldn't send your request.");
    });

    it("shows KPI value before its label", () => {
        const { container } = render(<KpiCard value="4,141" label="Register rows" />);
        expect(container.textContent).toBe("4,141Register rows");
    });

    it("moves between tabs with the arrow keys", () => {
        function Harness() {
            const [active, setActive] = useState("a");
            return (
                <Tabs label="Example" activeId={active} onChange={setActive} items={[{ id: "a", label: "Overview" }, { id: "b", label: "Detail" }]}>
                    {active}
                </Tabs>
            );
        }
        render(<Harness />);
        fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), { key: "ArrowRight" });
        expect(screen.getByRole("tab", { name: "Detail" })).toHaveAttribute("aria-selected", "true");
    });
});
