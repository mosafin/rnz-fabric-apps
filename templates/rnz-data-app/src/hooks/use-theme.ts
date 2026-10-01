//-----------------------------------------------------------------------
// RNZ override of the Microsoft data app theme hook.
// Copyright (c) Microsoft Corporation (original). Licensed under the MIT license.
//
// RNZ Fabric apps ship in the light theme only (ricoh-brand-methodology-v12.html,
// Section 12). This hook keeps the original signature so Microsoft code that
// calls `useAppTheme()` still compiles, but it always reports light, removes any
// `.dark` class a host adds, and ignores `prefers-color-scheme` and
// `data-appearance`. Do not add a theme toggle to RNZ apps.
// Brand-managed file: update it in the template, then run `npm run rnz:sync`.
//-----------------------------------------------------------------------

import { useEffect } from "react";

export function useAppTheme() {
    useEffect(() => {
        const root = document.documentElement;
        const forceLight = () => {
            if (root.classList.contains("dark")) root.classList.remove("dark");
        };
        forceLight();

        // A host (such as the Fabric portal in dark mode) may add `.dark`.
        // Remove it again so RNZ tokens always render light.
        const observer = new MutationObserver(forceLight);
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // Kept for API compatibility. Intentionally does nothing.
    const toggleTheme = () => {};

    return { isDark: false as const, toggleTheme };
}
