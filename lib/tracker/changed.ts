"use client";

import { useEffect, useRef } from "react";

const EVENT = "mblpfin:tracker-changed";

/** Call after any entry is added / edited / deleted. Lists and totals that were
 *  fetched client-side listen for it and reload themselves. */
export function notifyTrackerChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function useTrackerChanged(cb: () => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    const h = () => ref.current();
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);
}
