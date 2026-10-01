// RNZ component kit: buttons. Brand-managed (v12.1 Section 10).
// One primary per view. Verb-led, sentence-case labels. Minimum height 44px.

import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "./button-classes";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant };

/** A link styled as a button, for actions that navigate (e.g. "Open folder"). */
export function LinkButton({ variant = "secondary", className, ...props }: LinkButtonProps) {
    return <a className={buttonClasses(variant, className)} {...props} />;
}
