"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/utils/api";
import { getMediaUrl } from "@/utils/media";
import PostContent from "@/components/PostContent";
import EmptyState from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function SavedPage() {
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api.get("/social/saved")
            .then(res => setSavedPosts(res.data))
            .catch(err => console.error("Failed to load saved posts", err))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <div className="flex flex-col">
                    <h2 className="text-xl font-extrabold text-heading">Saved Posts</h2>
                </div>
            </header>

            {isLoading ? (
                <div className="p-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
                </div>
            ) : savedPosts.length === 0 ? (
                <EmptyState
                    icon={Bookmark}
                    title="No saved posts"
                    description="Save posts to read later by tapping the bookmark icon on any post."
                />
            ) : (
                <div className="flex flex-col">
                    {savedPosts.map((post) => (
                        <article key={post.id} onClick={() => router.push(`/post/${post.id}`)} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                            <div className="flex gap-3">
                                <div
                                    className="w-11 h-11 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                                >
                                    {post.user.profileImage ? (
                                        <img src={getMediaUrl(post.user.profileImage)} alt={post.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold uppercase text-[#0085ff] text-sm">{post.user.username[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span
                                            className="font-bold text-heading text-[15px] hover:underline cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                                        >
                                            {post.user.username}
                                        </span>
                                        {post.user.isAi && (
                                            <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                                        )}
                                        <span
                                            className="text-secondary-text text-[15px] cursor-pointer hover:underline"
                                            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                                        >
                                            @{post.user.username}
                                        </span>
                                        <span className="text-secondary-text text-[15px]">·</span>
                                        <span className="text-secondary-text text-[15px] hover:underline">{formatDistanceToNow(new Date(post.createdAt))}</span>
                                    </div>
                                    <div className="mt-0.5">
                                        <PostContent content={post.content} media={post.media} />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
