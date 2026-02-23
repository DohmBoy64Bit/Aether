"use client";

import { ExternalLink, Play } from "lucide-react";
import { getMediaUrl } from "@/utils/media";
import Link from "next/link";

// Types matching backend PostMedia
interface PostMediaLink {
    url: string;
    title: string;
    description?: string;
    thumbnail?: string;
}

interface PostMediaImage {
    url: string;
    alt?: string;
}

interface PostMediaVideo {
    url: string;
    iframe_src: string;
    title: string;
    thumbnail?: string;
}

interface PostMedia {
    links?: PostMediaLink[];
    images?: PostMediaImage[];
    video?: PostMediaVideo;
}

/**
 * Parses post content for markdown links [text](url)
 * Returns React elements with clickable links
 */
function parseContentWithLinks(content: string): React.ReactNode[] {
    if (!content) return [];

    // Matches markdown links [text](url), @mentions, and #hashtags
    const regex = /(\[[^\]]+\]\([^)]+\)|@[\w]+|#[\w]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        // Add text before the matched token
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }

        const token = match[0];

        if (token.startsWith('[')) {
            // It's a markdown link
            const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
            if (linkMatch) {
                parts.push(
                    <a
                        key={`link-${match.index}`}
                        href={linkMatch[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0085ff] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {linkMatch[1]}
                    </a>
                );
            } else {
                parts.push(token);
            }
        } else if (token.startsWith('@')) {
            // It's a mention
            parts.push(
                <Link
                    key={`mention-${match.index}`}
                    href={`/profile/${token.slice(1)}`}
                    className="text-[#0085ff] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {token}
                </Link>
            );
        } else if (token.startsWith('#')) {
            // It's a hashtag
            parts.push(
                <Link
                    key={`tag-${match.index}`}
                    href={`/explore?q=${encodeURIComponent(token)}`}
                    className="text-[#0085ff] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {token}
                </Link>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
}

/**
 * Extracts domain from a URL for display
 */
function getDomain(url: string): string {
    try {
        const u = new URL(url);
        return u.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

/**
 * Link Preview Card — matches Bluesky/Twitter style
 */
function LinkCard({ link }: { link: PostMediaLink }) {
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 border border-gray-200 rounded-2xl overflow-hidden hover:bg-gray-50 transition-colors"
            onClick={(e) => e.stopPropagation()}
        >
            {link.thumbnail && (
                <div className="w-full aspect-[2/1] bg-gray-100 overflow-hidden">
                    <img
                        src={getMediaUrl(link.thumbnail)}
                        alt={link.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}
            <div className="px-3.5 py-2.5">
                <p className="text-[15px] font-semibold text-heading leading-tight line-clamp-2">{link.title}</p>
                {link.description && (
                    <p className="text-[13px] text-secondary-text mt-0.5 line-clamp-2 leading-snug">{link.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                    <ExternalLink className="w-3 h-3 text-secondary-text" />
                    <span className="text-[12px] text-secondary-text">{getDomain(link.url)}</span>
                </div>
            </div>
        </a>
    );
}

/**
 * Image Grid — handles 1 to 4 images
 * 1 image: full width
 * 2 images: side by side
 * 3 images: 1 large + 2 stacked
 * 4 images: 2x2 grid
 */
function ImageGrid({ images }: { images: PostMediaImage[] }) {
    const count = Math.min(images.length, 4);
    const displayed = images.slice(0, 4);

    if (count === 1) {
        return (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
                <img
                    src={getMediaUrl(displayed[0].url)}
                    alt={displayed[0].alt || 'Post image'}
                    className="w-full max-h-[400px] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
            </div>
        );
    }

    if (count === 2) {
        return (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 grid grid-cols-2 gap-[2px]">
                {displayed.map((img, i) => (
                    <img
                        key={i}
                        src={getMediaUrl(img.url)}
                        alt={img.alt || `Image ${i + 1}`}
                        className="w-full h-[200px] object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ))}
            </div>
        );
    }

    if (count === 3) {
        return (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 grid grid-cols-2 gap-[2px] h-[300px]">
                <img
                    src={getMediaUrl(displayed[0].url)}
                    alt={displayed[0].alt || 'Image 1'}
                    className="w-full h-full object-cover row-span-2"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <img
                    src={getMediaUrl(displayed[1].url)}
                    alt={displayed[1].alt || 'Image 2'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <img
                    src={getMediaUrl(displayed[2].url)}
                    alt={displayed[2].alt || 'Image 3'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            </div>
        );
    }

    // 4 images: 2x2 grid
    return (
        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 grid grid-cols-2 gap-[2px]">
            {displayed.map((img, i) => (
                <img
                    key={i}
                    src={getMediaUrl(img.url)}
                    alt={img.alt || `Image ${i + 1}`}
                    className="w-full h-[180px] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            ))}
        </div>
    );
}

/**
 * Video Embed — YouTube/Dailymotion iframes
 */
function VideoEmbed({ video }: { video: PostMediaVideo }) {
    const [playing, setPlaying] = useState(false);

    if (!playing) {
        return (
            <div
                className="mt-3 rounded-2xl overflow-hidden border border-gray-200 relative cursor-pointer group"
                onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
            >
                {video.thumbnail ? (
                    <img
                        src={getMediaUrl(video.thumbnail)}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                    />
                ) : (
                    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">{video.title}</span>
                    </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" />
                    </div>
                </div>
                {/* Bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2.5">
                    <p className="text-white text-[13px] font-medium line-clamp-1">{video.title}</p>
                    <span className="text-white/70 text-[11px]">{getDomain(video.url)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <iframe
                src={video.iframe_src}
                title={video.title}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}

import { useState } from "react";

/**
 * PostContent component — renders post text with parsed links
 * and rich media attachments (link cards, image grids, video embeds).
 * 
 * Use this component wherever post content is displayed.
 */
export default function PostContent({
    content,
    media,
    textClassName = "text-heading text-[15px] leading-relaxed",
}: {
    content: string;
    media?: string | null;
    textClassName?: string;
}) {
    const parsedContent = parseContentWithLinks(content);

    // Parse media JSON
    let mediaData: PostMedia | null = null;
    if (media) {
        try {
            mediaData = JSON.parse(media) as PostMedia;
        } catch {
            // ignore invalid JSON
        }
    }

    return (
        <div>
            {/* Post text with inline links */}
            <p className={`${textClassName} whitespace-pre-wrap mt-0.5`}>
                {parsedContent}
            </p>

            {/* Rich media attachments */}
            {mediaData && (
                <>
                    {/* Link preview card */}
                    {mediaData.links && mediaData.links.length > 0 && (
                        <LinkCard link={mediaData.links[0]} />
                    )}

                    {/* Image grid */}
                    {mediaData.images && mediaData.images.length > 0 && (
                        <ImageGrid images={mediaData.images} />
                    )}

                    {/* Video embed */}
                    {mediaData.video && (
                        <VideoEmbed video={mediaData.video} />
                    )}
                </>
            )}
        </div>
    );
}
