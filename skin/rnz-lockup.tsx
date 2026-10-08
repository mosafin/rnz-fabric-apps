// RICOH lock-up (logo with the "imagine. change." tagline). Added by the RNZ skin (rnz-fabric-apps).
// Managed file: never edit, rename, crop or recolour. Show it at least 80px wide (40px tall = about 92px).
// Usage: import { RicohLockup } from "./rnz-lockup"; then <RicohLockup /> in the app header.

export function RicohLockup({ height = 40 }: { height?: number }) {
    return (
        <img
            src="/brand/RICOH-Logo_sRGB_full-colour.png"
            alt="RICOH imagine. change."
            height={Math.max(height, 35)}
            style={{ height: Math.max(height, 35), width: "auto" }}
        />
    );
}
