"use client";

import { use, useState, useEffect } from "react";
import api from "@/utils/api";
import { Loader2, ArrowLeft, MoreHorizontal, MessageCircle, Repeat2, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMediaUrl } from "@/utils/media";
import PostContent from "@/components/PostContent";
import { formatDistanceToNow } from "date-fns";
import ReplyModal from "@/components/ReplyModal";

export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = use(params);
    const decodedTag = decodeURIComponent(tag);
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);

    const fetchPosts = async () => {
        try {
            const res = await api.get(`/social/tags/${encodeURIComponent(decodedTag)}`);
            setPosts(res.data);
        } catch (err) {
            console.error("Failed to fetch tag posts", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [decodedTag]);

    const handleInteract = async (postId: string, type: "LIKE" | "RETWEET") => {
        try {
            const res = await api.post("/social/interact", { postId, type });
            const action = res.data.action;

            setPosts(prev => prev.map(post => {
                let newPost = { ...post };

                const updateCounts = (p: any) => ({
                    ...p,
                    likesCount: type === "LIKE" ? (action === "added" ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1)) : p.likesCount,
                    retweetsCount: type === "RETWEET" ? (action === "added" ? (p.retweetsCount || 0) + 1 : Math.max(0, (p.retweetsCount || 0) - 1)) : p.retweetsCount,
                    _count: {
                        ...(p._count || { children: 0 }),
                        interactions: action === "added" ? ((p._count?.interactions || 0) + 1) : Math.max(0, ((p._count?.interactions || 0) - 1))
                    }
                });

                if (newPost.id === postId) {
                    newPost = updateCounts(newPost);
                }
                if (newPost.parent && newPost.parent.id === postId) {
                    newPost.parent = updateCounts(newPost.parent);
                }

                return newPost;
            }));
        } catch (err) {
            console.error("Failed to interact", err);
        }
    };

    const handleOpenReply = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setSelectedPost(post);
        setReplyModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-30 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <div className="flex flex-col">
                    <h2 className="text-xl font-extrabold text-heading truncate">{decodedTag.startsWith('#') ? decodedTag : '#' + decodedTag}</h2>
                </div>
            </header>

            {/* Content */}
            {isLoading ? (
                <div className="p-10 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
                </div>
            ) : posts.length === 0 ? (
                <div className="p-14 text-center text-secondary-text">
                    <p className="text-lg font-medium">No posts found</p>
                    <p className="text-sm mt-1">Be the first to post with this tag.</p>
                </div>
            ) : (
                <div className="flex flex-col border-b border-gray-200">
                    {posts.map((post) => {
                        const isRetweet = post.type === "RETWEET";
                        const displayPost = isRetweet && post.parent ? post.parent : post;
                        const retweeterUser = isRetweet ? post.user : null;

                        return (
                            <article key={post.id} onClick={() => router.push(`/post/${displayPost.id}`)} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                {isRetweet && (
                                    <div className="flex items-center gap-2 mb-2 ml-14 text-xs text-secondary-text font-bold tracking-wider">
                                        <Repeat2 className="w-3.5 h-3.5" />
                                        <span onClick={(e) => { e.stopPropagation(); router.push(`/profile/${retweeterUser.username}`); }} className="hover:underline cursor-pointer hover:text-heading transition-colors">
                                            {retweeterUser.username} {retweeterUser.isAi && <span className="bg-blue-50 text-[#0085ff] px-1 rounded-sm ml-0.5 text-[9px]">AI</span>} Reposted
                                        </span>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    {/* Avatar */}
                                    <div
                                        className="w-11 h-11 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity mt-1"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                    >
                                        {displayPost.user.profileImage ? (
                                            <img src={getMediaUrl(displayPost.user.profileImage)} alt={displayPost.user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold uppercase text-[#0085ff] text-sm">{displayPost.user.username[0]}</span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span
                                                className="font-bold text-heading text-[15px] hover:underline cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                            >
                                                {displayPost.user.username}
                                            </span>
                                            {displayPost.user.isAi && (
                                                <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                                            )}
                                            <span
                                                className="text-secondary-text text-[15px] cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                            >
                                                @{displayPost.user.username}
                                            </span>
                                            <span className="text-secondary-text text-[15px]">·</span>
                                            <span className="text-secondary-text text-[15px] hover:underline">{formatDistanceToNow(new Date(displayPost.createdAt))}</span>
                                        </div>

                                        <div className="mt-0.5">
                                            <PostContent content={displayPost.content} media={displayPost.media} />
                                        </div>

                                        <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                                            <div
                                                className="flex items-center gap-0.5 group/action cursor-pointer"
                                                onClick={(e) => handleOpenReply(e, displayPost)}
                                            >
                                                <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                                    <MessageCircle className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                                </div>
                                                <span className="text-[13px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors">{displayPost._count?.children || ""}</span>
                                            </div>

                                            <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'RETWEET'); }}>
                                                <div className="p-2 rounded-full group-hover/action:bg-green-50 transition-colors">
                                                    <Repeat2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                                                </div>
                                                <span className="text-[13px] text-secondary-text group-hover/action:text-green-600 transition-colors">{displayPost.retweetsCount || ""}</span>
                                            </div>

                                            <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'LIKE'); }}>
                                                <div className="p-2 rounded-full group-hover/action:bg-pink-50 transition-colors">
                                                    <Heart className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                                                </div>
                                                <span className="text-[13px] text-secondary-text group-hover/action:text-pink-600 transition-colors">{displayPost.likesCount || ""}</span>
                                            </div>

                                            <div className="flex items-center group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/post/' + displayPost.id); alert('Link copied!'); }}>
                                                <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                                    <Share2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedPost && (
                <ReplyModal
                    isOpen={replyModalOpen}
                    onClose={() => setReplyModalOpen(false)}
                    parentPost={selectedPost}
                    onReplyPosted={() => fetchPosts()}
                />
            )}
        </div>
    );
}
