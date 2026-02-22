"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import PostComposer from "./PostComposer";
import { useMediaComposer } from "@/hooks/useMediaComposer";

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentPost: any;
    onReplyPosted?: () => void;
}

export default function ReplyModal({ isOpen, onClose, parentPost, onReplyPosted }: ReplyModalProps) {
    const [isPosting, setIsPosting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const composer = useMediaComposer();

    useEffect(() => {
        if (isOpen) {
            api.get("/auth/me").then(res => setCurrentUser(res.data)).catch(() => { });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            composer.clearComposer();
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    const handleReply = async () => {
        if (!composer.canPost) return;
        setIsPosting(true);
        try {
            const mediaPayload = composer.getMediaPayload();
            await api.post("/social/posts", {
                content: composer.content,
                media: mediaPayload ? JSON.stringify(mediaPayload) : null,
                type: "REPLY",
                parentId: parentPost.id
            });
            composer.clearComposer();
            onReplyPosted?.();
            onClose();
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center sm:pt-12 p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-[600px] sm:rounded-2xl flex flex-col relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <button
                        onClick={onClose}
                        className="text-heading hover:bg-gray-100 p-2 rounded-full transition-colors font-medium text-sm -ml-2"
                    >
                        Cancel
                    </button>
                    <div className="font-bold text-heading">Reply</div>
                    <div className="w-12"></div> {/* Spacer for centering */}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[80vh] p-4 bg-white">
                    {/* Parent Post Context */}
                    <div className="flex gap-3 relative pb-4">
                        {/* Connecting Line */}
                        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />

                        <div className="w-9 h-9 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                            {parentPost.user.profileImage ? (
                                <img src={parentPost.user.profileImage} alt={parentPost.user.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold uppercase text-[#0085ff] text-xs">{parentPost.user.username[0]}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold text-heading text-[15px]">{parentPost.user.username}</span>
                                <span className="text-secondary-text text-[14px]">@{parentPost.user.username}</span>
                                <span className="text-secondary-text text-[14px]">·</span>
                                <span className="text-secondary-text text-[14px]">{formatDistanceToNow(new Date(parentPost.createdAt))}</span>
                            </div>
                            <div className="text-heading text-[15px] leading-relaxed line-clamp-4 overflow-hidden mb-1">
                                {parentPost.content}
                            </div>
                            <div className="text-sm text-secondary-text mt-2">
                                Replying to <span className="text-[#0085ff]">@{parentPost.user.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reply Input Area using PostComposer (but rendering slightly tweaked CSS so we wrap it tightly) */}
                    <div className="-mx-4 -mb-4">
                        <PostComposer
                            currentUser={currentUser}
                            composer={composer}
                            onPost={handleReply}
                            isPosting={isPosting}
                            placeholder="Post your reply"
                            submitLabel="Reply"
                            avatarSize="w-9 h-9"
                            minHeight="min-h-[120px]"
                            autoFocus={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
