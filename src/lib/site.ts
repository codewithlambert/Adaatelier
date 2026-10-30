/**
 * Public origin of the deployed site, e.g. "https://adaatelier.com" (set VITE_SITE_URL in the host).
 * Social cards need absolute image URLs; without it they fall back to root-relative paths.
 */
export const SITE_URL = String(import.meta.env["VITE_SITE_URL"] ?? "").replace(/\/$/, "");

export const absoluteUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;

export const SHARE_IMAGE = absoluteUrl("/og-image.jpg");
