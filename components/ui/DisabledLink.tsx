"use client";

/**
 * Temporary "disabled link" component for Razorpay verification window.
 *
 * Razorpay's KYC verification scrutinizes the website for transparency —
 * external project links can be flagged. This component renders a button
 * that LOOKS like a link but shows a "Coming soon" toast on click instead
 * of navigating away.
 *
 * To restore real links after Razorpay activation completes:
 *   1. Find usages: grep -rn "DisabledLink" components/
 *   2. Replace each `<DisabledLink>` with `<Link href="..." target="_blank" rel="noopener noreferrer">`
 *   3. Add the original href back (see the inline comments where each is used)
 *   4. Delete this file
 */

import { useState } from "react";

interface DisabledLinkProps {
  children: React.ReactNode;
  className?: string;
  /** Optional override for the toast message. Defaults to "Coming soon — link temporarily disabled" */
  toastMessage?: string;
}

export default function DisabledLink({
  children,
  className = "",
  toastMessage = "Coming soon — link temporarily disabled",
}: DisabledLinkProps) {
  const [show, setShow] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setShow(true);
    window.setTimeout(() => setShow(false), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${className} cursor-pointer text-left`}
        aria-label={typeof children === "string" ? children : "Coming soon"}
      >
        {children}
      </button>
      {show && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-lg shadow-xl font-inter text-sm whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
