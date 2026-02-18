"use client";

import { X, Image as ImageIcon, List, Smile, Loader2, Repeat2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";
import PostContent from "./PostContent";
import { formatDistanceToNow } from "date-fns";

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentPost: any;
    onReplyPosted?: () => void;
}

export default function ReplyModal({ isOpen, onClose, parentPost, onReplyPosted }: ReplyModalProps) {
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const charLimit = 300;
    const charCount = content.length;
    const percentage = Math.min((charCount / charLimit) * 100, 100);
    const isOverLimit = charCount > charLimit;

    useEffect(() => {
        if (isOpen) {
            api.get("/auth/me").then(res => setCurrentUser(res.data)).catch(() => { });
            setTimeout(() => textareaRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    const handleReply = async () => {
        if (!content.trim() || isOverLimit) return;
        setIsPosting(true);
        try {
            await api.post("/social/posts", { content, type: "REPLY", parentId: parentPost.id });
            setContent("");
            onReplyPosted?.();
            onClose();
        } catch (err) {
            console.error("Failed to reply", err);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    // Circular meter path calculation
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getMeterColor = () => {
        if (charCount >= charLimit) return "#ef4444"; // Red
        if (charCount >= charLimit - 20) return "#f97316"; // Orange
        return "#0085ff"; // Blue
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center sm:pt-12 p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-[#151d28] w-full max-w-[600px] sm:rounded-2xl flex flex-col relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/10 p-2 rounded-full transition-colors font-medium text-sm -ml-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReply}
                        disabled={isPosting || !content.trim() || isOverLimit}
                        className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:grayscale text-sm py-1.5 px-5 flex items-center gap-2 active:scale-95"
                    >
                        {isPosting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Reply
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[70vh] p-4">
                    {/* Parent Post Context */}
                    <div className="flex gap-3 relative pb-4">
                        {/* Connecting Line */}
                        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-700" />

                        <div className="w-9 h-9 bg-[#1c2736] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-700">
                            {parentPost.user.profileImage ? (
                                <img src={parentPost.user.profileImage} alt={parentPost.user.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold uppercase text-[#0085ff] text-xs">{parentPost.user.username[0]}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold text-white text-[15px]">{parentPost.user.username}</span>
                                <span className="text-gray-400 text-[14px]">@{parentPost.user.username}</span>
                                <span className="text-gray-500 text-[14px]">·</span>
                                <span className="text-gray-500 text-[14px]">{formatDistanceToNow(new Date(parentPost.createdAt))}</span>
                            </div>
                            <div className="text-white text-[15px] leading-relaxed line-clamp-4 overflow-hidden mb-1">
                                {parentPost.content}
                            </div>
                        </div>
                    </div>

                    {/* Reply Input Area */}
                    <div className="flex gap-3 pt-2">
                        <div className="w-9 h-9 bg-[#0085ff] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs overflow-hidden relative z-10 border-2 border-[#151d28] shadow-lg">
                            {currentUser?.profileImage ? (
                                <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                            ) : (
                                <span>{currentUser?.username?.[0]?.toUpperCase() || "@"}</span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col pt-1.5">
                            <textarea
                                ref={textareaRef}
                                placeholder="Write your reply"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="bg-transparent text-white text-lg resize-none outline-none border-none placeholder:text-gray-600 min-h-[120px] w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Tools */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-800 bg-[#151d28]/80 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-full text-[#0085ff] hover:bg-[#0085ff]/10 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full text-[#0085ff] hover:bg-[#0085ff]/10 transition-colors">
                            <List className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full text-[#0085ff] hover:bg-[#0085ff]/10 transition-colors">
                            <Smile className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Word Count Indicator */}
                        <div className="flex items-center gap-3">
                            {charCount > 0 && (
                                <span className={`text-xs font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                                    {charLimit - charCount}
                                </span>
                            )}
                            <div className="relative w-7 h-7 flex items-center justify-center">
                                <svg className="w-7 h-7 -rotate-90">
                                    {/* Background Circle */}
                                    <circle
                                        cx="14"
                                        cy="14"
                                        r={radius}
                                        fill="transparent"
                                        stroke="#1c2736"
                                        strokeWidth="2.5"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="14"
                                        cy="14"
                                        r={radius}
                                        fill="transparent"
                                        stroke={getMeterColor()}
                                        strokeWidth="2.5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        className="transition-[stroke-dashoffset] duration-300 ease-out"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
