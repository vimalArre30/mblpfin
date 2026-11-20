/**
 * Google Analytics 4 configuration.
 *
 * Two GA4 properties — one for the real site, one for staging/preview — chosen
 * at request time from the HOSTNAME, so no Vercel env vars are required.
 * GA measurement IDs are public (they are visible in every page's source),
 * so hardcoding them is safe.
 *
 * Routing rule (fails safe): only the real production hostnames report to the
 * production property. Every other host (staging, branch/preview URLs, the
 * default *.vercel.app domains) reports to the staging property, so test
 * traffic can never pollute production numbers. localhost reports nowhere.
 */

export const GA_PROPERTIES = {
  production: "G-RNC242FSLM",
  staging: "G-DL2CT5QPK4",
} as const;

/** Google Ads conversion tag — production traffic only. */
export const GOOGLE_ADS_ID = "AW-18168938718";

/** Hostnames that count as the real production site. */
const PRODUCTION_HOSTS = new Set(["mblpfin.com", "www.mblpfin.com"]);

export type GaTarget = {
  /** GA4 measurement ID to load, or null when GA must not load at all. */
  id: string | null;
  isProduction: boolean;
};

/** Strip the port and lower-case a Host / X-Forwarded-Host header value. */
function normaliseHost(host: string | null | undefined): string {
  return (host ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
}

export function resolveGaTarget(host: string | null | undefined): GaTarget {
  const h = normaliseHost(host);

  // No host, or local development: do not load GA.
  if (
    !h ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local")
  ) {
    return { id: null, isProduction: false };
  }

  if (PRODUCTION_HOSTS.has(h)) {
    return { id: GA_PROPERTIES.production, isProduction: true };
  }
  return { id: GA_PROPERTIES.staging, isProduction: false };
}
