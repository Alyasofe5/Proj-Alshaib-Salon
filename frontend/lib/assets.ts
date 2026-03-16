/**
 * Asset URL Resolver
 * ==================
 * Centralized helper to convert relative upload paths (e.g. "uploads/logos/salon_1.png")
 * into full absolute URLs pointing to the backend server where files are stored.
 *
 * The backend API URL is: https://maqas.site/api
 * The uploads live at:    https://maqas.site/uploads/...
 *
 * We derive the site base from NEXT_PUBLIC_API_URL by stripping the trailing "/api".
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Derive site base: "https://maqas.site/api" → "https://maqas.site"
function getSiteBase(): string {
    if (!API_URL) return "";
    // Strip trailing /api or /api/
    return API_URL.replace(/\/api\/?$/, "");
}

const SITE_BASE = getSiteBase();

/**
 * Resolves a relative asset path to a full URL.
 *
 * Examples:
 *   assetUrl("uploads/logos/salon_1.png")  → "https://maqas.site/uploads/logos/salon_1.png"
 *   assetUrl("/uploads/logos/salon_1.png") → "https://maqas.site/uploads/logos/salon_1.png"
 *   assetUrl("https://example.com/img.png") → "https://example.com/img.png"  (unchanged)
 *   assetUrl(null)                          → null
 *   assetUrl("")                            → null
 */
export function assetUrl(path: string | null | undefined): string | null {
    if (!path || path.trim() === "") return null;

    // Already an absolute URL — return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // Strip leading slash for consistency
    const clean = path.startsWith("/") ? path.slice(1) : path;

    if (!SITE_BASE) {
        // Fallback: just prepend / (for local dev with proxy)
        return `/${clean}`;
    }

    return `${SITE_BASE}/${clean}`;
}
