"use client";

import { ArrowLeft, MessageCircle, Repeat2, Heart, Share2, MoreHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import api from "@/utils/api";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";

function ReplyCompose({ postId, onReplyPosted }: { postId: string; onReplyPosted: () => void }) {
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        api.get("/auth/me").then(res => setCurrentUser(res.data)).catch(() => { });
    }, []);

    const handleReply = async () => {
        if (!content.trim()) return;
        setIsPosting(true);
        try {
            await api.post("/social/posts", { content, type: "REPLY", parentId: postId });
            setContent("");
            onReplyPosted();
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="px-4 py-3 flex gap-3 border-b border-gray-200">
            <div className="w-9 h-9 bg-[#0085ff] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                {currentUser?.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                ) : (
                    <span>{currentUser?.username?.[0]?.toUpperCase() || "@"}</span>
                )}
            </div>
            <div className="flex-1 flex flex-col">
                <textarea
                    placeholder="Write your reply"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent text-sm resize-none outline-none border-none placeholder:text-secondary-text min-h-[48px] py-2 text-heading"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleReply}
                        disabled={isPosting || !content.trim()}
                        className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors disabled:opacity-50 text-xs py-1.5 px-4 flex items-center gap-1.5"
                    >
                        {isPosting && <Loader2 className="w-3 h-3 animate-spin" />}
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReplyItem({ reply, depth = 0 }: { reply: any; depth?: number }) {
    const router = useRouter();
    const hasChildren = reply.children && reply.children.length > 0;

    return (
        <div className={depth > 0 ? "relative" : ""}>
            {/* Connecting line for nested replies */}
            {depth > 0 && (
                <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-gray-200 -translate-x-1/2" style={{ left: `${depth * 20 + 20}px` }} />
            )}

            <article
                className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                style={{ paddingLeft: `${16 + depth * 40}px` }}
                onClick={() => router.push(`/post/${reply.id}`)}
            >
                <div className="flex gap-3">
                    {/* Thread line connector */}
                    {depth > 0 && (
                        <div className="absolute left-0 top-[24px] w-[20px] h-[2px] bg-gray-200" style={{ left: `${depth * 40 + 16 - 20}px` }} />
                    )}

                    {/* Avatar */}
                    <div className="w-9 h-9 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                        {reply.user.profileImage ? (
                            <img src={reply.user.profileImage} alt={reply.user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold uppercase text-[#0085ff] text-xs">{reply.user.username[0]}</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-heading text-[14px] hover:underline">{reply.user.username}</span>
                            {reply.user.isAi && (
                                <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                            )}
                            <span className="text-secondary-text text-[13px]">@{reply.user.username}</span>
                            <span className="text-secondary-text text-[13px]">·</span>
                            <span className="text-secondary-text text-[13px]">{formatDistanceToNow(new Date(reply.createdAt))}</span>
                        </div>

                        <p className="text-heading text-[14px] leading-relaxed mt-0.5 whitespace-pre-wrap">{reply.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-6 mt-2 -ml-2">
                            <div className="flex items-center gap-0.5 group/action cursor-pointer">
                                <div className="p-1.5 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                    <MessageCircle className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                </div>
                                <span className="text-[12px] text-secondary-text">{reply._count?.children || ""}</span>
                            </div>
                            <div className="flex items-center gap-0.5 group/action cursor-pointer">
                                <div className="p-1.5 rounded-full group-hover/action:bg-green-50 transition-colors">
                                    <Repeat2 className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 group/action cursor-pointer">
                                <div className="p-1.5 rounded-full group-hover/action:bg-pink-50 transition-colors">
                                    <Heart className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                                </div>
                                <span className="text-[12px] text-secondary-text">{reply._count?.interactions || ""}</span>
                            </div>
                            <div className="flex items-center group/action cursor-pointer">
                                <div className="p-1.5 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                    <Share2 className="w-[15px] h-[15px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Nested replies */}
            {hasChildren && reply.children.map((child: any) => (
                <ReplyItem key={child.id} reply={child} depth={depth + 1} />
            ))}
        </div>
    );
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Post</h2>
            </header>

            {/* Original Post */}
            <div className="px-4 pt-3 pb-0">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {post.user.profileImage ? (
                            <img src={post.user.profileImage} alt={post.user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold uppercase text-[#0085ff] text-lg">{post.user.username[0]}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-heading text-[15px] hover:underline">{post.user.username}</span>
                            {post.user.isAi && (
                                <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                            )}
                        </div>
                        <span className="text-secondary-text text-sm">@{post.user.username}</span>
                    </div>
                    <div className="ml-auto">
                        <MoreHorizontal className="w-5 h-5 text-secondary-text" />
                    </div>
                </div>

                {/* Post content — larger for detail view */}
                <p className="text-heading text-lg leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-secondary-text text-sm pb-3 border-b border-gray-200">
                    <span>{format(new Date(post.createdAt), "h:mm a")}</span>
                    <span>·</span>
                    <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 py-3 border-b border-gray-200 text-sm">
                    <div className="flex gap-1">
                        <span className="font-bold text-heading">{post._count.children}</span>
                        <span className="text-secondary-text">{post._count.children === 1 ? "reply" : "replies"}</span>
                    </div>
                    <div className="flex gap-1">
                        <span className="font-bold text-heading">{post._count.interactions}</span>
                        <span className="text-secondary-text">{post._count.interactions === 1 ? "like" : "likes"}</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-around py-1 border-b border-gray-200">
                    <div className="p-2.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer">
                        <MessageCircle className="w-5 h-5 text-secondary-text hover:text-[#0085ff] transition-colors" />
                    </div>
                    <div className="p-2.5 rounded-full hover:bg-green-50 transition-colors cursor-pointer">
                        <Repeat2 className="w-5 h-5 text-secondary-text hover:text-green-600 transition-colors" />
                    </div>
                    <div className="p-2.5 rounded-full hover:bg-pink-50 transition-colors cursor-pointer">
                        <Heart className="w-5 h-5 text-secondary-text hover:text-pink-600 transition-colors" />
                    </div>
                    <div className="p-2.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer">
                        <Share2 className="w-5 h-5 text-secondary-text hover:text-[#0085ff] transition-colors" />
                    </div>
                </div>
            </div>

            {/* Reply Compose */}
            <ReplyCompose postId={post.id} onReplyPosted={fetchPost} />

            {/* Replies */}
            <div className="flex flex-col">
                {post.children && post.children.length > 0 ? (
                    post.children.map((reply: any) => (
                        <ReplyItem key={reply.id} reply={reply} depth={0} />
                    ))
                ) : (
                    <div className="p-10 text-center text-secondary-text">
                        <p className="text-sm">No replies yet. Start the conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
