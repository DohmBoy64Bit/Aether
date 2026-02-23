"use client";

import { ArrowLeft, MessageCircle, Repeat2, Heart, Share2, MoreHorizontal, Loader2, X } from "lucide-react";
import PostContent from "@/components/PostContent";
import Link from "next/link";
import PostComposer from "@/components/PostComposer";
import { useMediaComposer } from "@/hooks/useMediaComposer";
import { useEffect, useState, use } from "react";
import api from "@/utils/api";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import ReplyModal from "@/components/ReplyModal";

function ReplyCompose({ postId, onReplyPosted }: { postId: string; onReplyPosted: () => void }) {
    const [isPosting, setIsPosting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const composer = useMediaComposer();

    useEffect(() => {
        api.get("/auth/me").then(res => setCurrentUser(res.data)).catch(() => { });
    }, []);

    const handleReply = async () => {
        if (!composer.canPost) return;
        setIsPosting(true);
        try {
            const mediaPayload = composer.getMediaPayload();
            await api.post("/social/posts", {
                content: composer.content,
                media: mediaPayload ? JSON.stringify(mediaPayload) : null,
                type: "REPLY",
                parentId: postId
            });
            composer.clearComposer();
            onReplyPosted();
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <PostComposer
            currentUser={currentUser}
            composer={composer}
            onPost={handleReply}
            isPosting={isPosting}
            placeholder="Write your reply"
            submitLabel="Reply"
            avatarSize="w-9 h-9"
            minHeight="min-h-[48px]"
        />
    );
}

function ReplyItem({ reply, depth = 0, isLast = false, onReplyPosted, onInteract }: { reply: any; depth?: number; isLast?: boolean; onReplyPosted: (post: any) => void; onInteract: (postId: string, type: "LIKE" | "RETWEET") => void }) {
    const router = useRouter();
    const hasChildren = reply.children && reply.children.length > 0;
    const visualDepth = Math.min(depth, 3);

    return (
        <div className="relative">
            {/* Mask for the last sibling's bottom spine */}
            {isLast && (
                <div
                    className="absolute left-[-2px] bottom-0 top-[28px] w-[2px] bg-white z-[5]"
                    style={{ display: hasChildren && depth < 3 ? 'none' : 'block' }}
                />
            )}

            <article
                className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group/post relative -ml-6 sm:-ml-[40px] pl-4 sm:pl-[22px]"
                onClick={() => router.push(`/post/${reply.id}`)}
            >
                <div className="flex gap-3 relative">
                    {/* Avatar center matches container's border-left */}
                    <div
                        className="w-9 h-9 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center relative z-20 border-2 border-white shadow-sm transition-transform cursor-pointer hover:opacity-80"
                        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reply.user.username}`); }}
                    >
                        {reply.user.profileImage ? (
                            <img src={reply.user.profileImage} alt={reply.user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold uppercase text-[#0085ff] text-xs">{reply.user.username[0]}</span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span
                                className="font-bold text-heading text-[14px] hover:underline whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reply.user.username}`); }}
                            >
                                {reply.user.username}
                            </span>
                            {reply.user.isAi && (
                                <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                            )}
                            <span
                                className="text-secondary-text text-[13px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reply.user.username}`); }}
                            >
                                @{reply.user.username}
                            </span>
                            <span className="text-secondary-text text-[13px]">·</span>
                            <span className="text-secondary-text text-[13px] whitespace-nowrap">
                                {formatDistanceToNow(new Date(reply.createdAt))}
                            </span>
                        </div>

                        <PostContent content={reply.content} media={reply.media} textClassName="text-heading text-[14px] leading-relaxed" />

                        <div className="flex items-center justify-between mt-2 max-w-[400px] -ml-2">
                            <div
                                className="flex items-center gap-0.5 group/action cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onReplyPosted(reply); }}
                            >
                                <div className="p-1.5 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                    <MessageCircle className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                </div>
                                <span className="text-[11px] text-secondary-text group-hover/action:text-[#0085ff]">{reply._count?.children || ""}</span>
                            </div>

                            <div
                                className="flex items-center gap-0.5 group/action cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onInteract(reply.id, 'RETWEET'); }}
                            >
                                <div className="p-1.5 rounded-full group-hover/action:bg-green-50 transition-colors">
                                    <Repeat2 className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                                </div>
                            </div>

                            <div
                                className="flex items-center gap-0.5 group/action cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onInteract(reply.id, 'LIKE'); }}
                            >
                                <div className="p-1.5 rounded-full group-hover/action:bg-pink-50 transition-colors">
                                    <Heart className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                                </div>
                                <span className="text-[11px] text-secondary-text group-hover/action:text-pink-600">{reply._count?.interactions || ""}</span>
                            </div>
                            <div
                                className="flex items-center group/action cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/post/' + reply.id); alert('Link copied!'); }}
                            >
                                <div className="p-1.5 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                    <Share2 className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Recursively bordered container for children */}
            {hasChildren && (
                depth < 3 ? (
                    <div className="ml-6 sm:ml-[34px] border-l-2 border-gray-100">
                        {reply.children.map((child: any, idx: number) => (
                            <ReplyItem
                                key={child.id}
                                reply={child}
                                depth={depth + 1}
                                isLast={idx === reply.children.length - 1}
                                onReplyPosted={onReplyPosted}
                                onInteract={onInteract}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-4 pl-4 relative">
                        {/* Short dash connecting link to spine */}
                        <div className="absolute left-0 top-0 bottom-[20px] w-0.5 bg-gray-100" />
                        <Link
                            href={`/post/${reply.id}`}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-[#0085ff] text-[12px] font-bold py-2 px-5 rounded-full transition-all shadow-sm flex items-center gap-2.5 w-fit active:scale-95"
                        >
                            <Repeat2 className="w-4 h-4" />
                            Show more replies
                            {reply._count?.children > 0 && (
                                <span className="opacity-60 font-medium">({reply._count.children})</span>
                            )}
                        </Link>
                    </div>
                )
            )}
        </div>
    );
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);

    const handleOpenReply = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setSelectedPost(post);
        setReplyModalOpen(true);
    };

    const handleInteract = async (postId: string, type: "LIKE" | "RETWEET") => {
        try {
            await api.post("/social/interact", { postId, type });
            fetchPost();
        } catch (err) {
            console.error("Failed to interact", err);
        }
    };

    const fetchPost = async () => {
        try {
            const res = await api.get(`/social/posts/${id}`);
            setPost(res.data);
        } catch (err) {
            console.error("Failed to fetch post", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-heading">Post not found</h1>
                <Link href="/" className="text-[#0085ff] hover:underline mt-2 inline-block">Go home</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-30 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Post</h2>
            </header>

            {/* Primary Post and Replies Container */}
            <div className="flex flex-col bg-white">
                <div className="px-4 pt-3 pb-0 relative">
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className="w-12 h-12 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                        >
                            {post.user.profileImage ? (
                                <img src={post.user.profileImage} alt={post.user.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold uppercase text-[#0085ff] text-lg">{post.user.username[0]}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="font-bold text-heading text-[15px] hover:underline cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                                >
                                    {post.user.username}
                                </span>
                                {post.user.isAi && (
                                    <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                                )}
                            </div>
                            <span
                                className="text-secondary-text text-sm cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.user.username}`); }}
                            >
                                @{post.user.username}
                            </span>
                        </div>
                        <div className="ml-auto relative group/more">
                            <div className="p-2 hover:bg-blue-50 rounded-full transition-colors cursor-pointer">
                                <MoreHorizontal className="w-5 h-5 text-secondary-text" />
                            </div>
                            <div className="absolute right-0 top-full w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-50 overflow-hidden translate-y-2 group-hover/more:translate-y-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); alert("Post reported. Our moderation team will review it shortly."); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                                >
                                    Report Post
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Post content */}
                    <div className="mb-3">
                        <PostContent content={post.content} media={post.media} textClassName="text-heading text-lg leading-relaxed" />
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-secondary-text text-sm pb-3 border-b border-gray-200">
                        <span>{format(new Date(post.createdAt), "h:mm a")}</span>
                        <span>·</span>
                        <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-200 text-sm">
                        <div className="flex gap-1">
                            <span className="font-bold text-heading">{post._count?.children || 0}</span>
                            <span className="text-secondary-text">{post._count?.children === 1 ? "reply" : "replies"}</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="font-bold text-heading">{post._count?.interactions || 0}</span>
                            <span className="text-secondary-text">{post._count?.interactions === 1 ? "like" : "likes"}</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-around py-1 border-b border-gray-200">
                        <div
                            className="p-2.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer group/action"
                            onClick={(e) => handleOpenReply(e, post)}
                        >
                            <MessageCircle className="w-5 h-5 text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                        </div>
                        <div
                            className="p-2.5 rounded-full hover:bg-green-50 transition-colors cursor-pointer group/action"
                            onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'RETWEET'); }}
                        >
                            <Repeat2 className="w-5 h-5 text-secondary-text group-hover/action:text-green-600 transition-colors" />
                        </div>
                        <div
                            className="p-2.5 rounded-full hover:bg-pink-50 transition-colors cursor-pointer group/action"
                            onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'LIKE'); }}
                        >
                            <Heart className="w-5 h-5 text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                        </div>
                        <div
                            className="p-2.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer group/action"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/post/' + post.id); alert('Link copied!'); }}
                        >
                            <Share2 className="w-5 h-5 text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                        </div>
                    </div>

                    {/* Reply Compose */}
                    <ReplyCompose postId={post.id} onReplyPosted={fetchPost} />
                </div>

                {/* Level-0 Replies Container with Spine from primary post */}
                <div className="relative ml-6 sm:ml-[40px] border-l-2 border-gray-100 min-h-[50px]">
                    {/* Connector dash from primary post avatar to the spine */}
                    <div className="absolute left-[-2px] -top-12 h-12 w-[2px] bg-gray-100 z-0" />

                    {post.children && post.children.length > 0 ? (
                        post.children.map((reply: any, idx: number) => (
                            <ReplyItem
                                key={reply.id}
                                reply={reply}
                                depth={0}
                                isLast={idx === post.children.length - 1}
                                onReplyPosted={(p) => handleOpenReply({ stopPropagation: () => { } } as any, p)}
                                onInteract={handleInteract}
                            />
                        ))
                    ) : (
                        <div className="py-10 px-4 text-center text-secondary-text -ml-6 sm:-ml-[40px]">
                            <p className="text-sm italic">Be the first to reply...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reply Modal */}
            {selectedPost && (
                <ReplyModal
                    isOpen={replyModalOpen}
                    onClose={() => setReplyModalOpen(false)}
                    parentPost={selectedPost}
                    onReplyPosted={fetchPost}
                />
            )}
        </div>
    );
}
