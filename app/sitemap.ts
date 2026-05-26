/**
 * REPLACED — see app/sitemap.xml/route.ts
 *
 * This file previously used Next.js's metadata-route convention to generate
 * /sitemap.xml. It has been replaced by a Route Handler at
 * app/sitemap.xml/route.ts which gives explicit control over Cache-Control
 * and Content-Type headers — fixing the persistent "Couldn't fetch" status
 * in Google Search Console caused by Next.js setting:
 *   cache-control: public, max-age=0, must-revalidate
 *
 * This file is intentionally kept as a stub (no default export) so that
 * Next.js does not regenerate the metadata-route sitemap. The Route Handler
 * takes full ownership of GET /sitemap.xml.
 *
 * Safe to delete this file entirely once confirmed working in production.
 */
