import { BACKEND_URL } from "./api";

/**
 * Ensures a media URL is absolute and points to the correct backend port.
 * If the URL is relative (starts with /uploads), it prefixes it with BACKEND_URL.
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return "";

    // If it's already absolute (e.g. http://, https://, data:), return as is
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    // If it starts with /uploads, prefix with BACKEND_URL
    if (url.startsWith("/uploads")) {
        return `${BACKEND_URL}${url}`;
    }

    return url;
}
