"use client";

import { Image as ImageIcon, Loader2, X, Play } from "lucide-react";
import { getMediaUrl } from "@/utils/media";

interface PostComposerProps {
    currentUser: any;
    composer: any; // Return type of useMediaComposer
    onPost: () => Promise<void> | void;
    isPosting: boolean;
    placeholder?: string;
    submitLabel?: string;
    autoFocus?: boolean;
    minHeight?: string;
    avatarSize?: string;
}

export default function PostComposer({
    currentUser,
    composer,
    onPost,
    isPosting,
    placeholder = "What's up?",
    submitLabel = "Post",
    autoFocus = false,
    minHeight = "min-h-[80px]",
    avatarSize = "w-11 h-11",
}: PostComposerProps) {
    const { content, setContent, mediaImages, linkPreview, videoEmbed, isUploading, fileInputRef, handleImageUpload, removeMedia, canPost } = composer;

    const charLimit = 280;
    const charCount = content.length;
    const charPercent = Math.min((charCount / charLimit) * 100, 100);
    const getMeterColor = () => {
        if (charCount >= charLimit) return "#ef4444"; // Red
        if (charCount >= charLimit - 20) return "#f97316"; // Orange
        return "#0085ff"; // Blue
    };

    return (
        <div className="px-4 py-3 flex gap-3 border-b border-gray-200">
            <div className={`${avatarSize} bg-[#0085ff] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm overflow-hidden`}>
                {currentUser?.profileImage ? (
                    <img src={getMediaUrl(currentUser.profileImage)} alt={currentUser.username} className="w-full h-full object-cover" />
                ) : (
                    <span>{currentUser?.username?.[0]?.toUpperCase() || "@"}</span>
                )}
            </div>
            <div className="flex-1 flex flex-col">
                <textarea
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`bg-transparent text-lg resize-none outline-none border-none placeholder:text-secondary-text ${minHeight} py-2 text-heading`}
                />

                {mediaImages.length > 0 && (
                    <div className="mb-3 relative inline-block">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {mediaImages.map((img: string, i: number) => (
                                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                    <img src={getMediaUrl(img)} alt="Upload" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <button onClick={removeMedia} className="absolute -top-2 -right-2 bg-gray-900/80 text-white rounded-full p-1 hover:bg-black">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {linkPreview && (
                    <div className="mb-3 relative border border-gray-200 rounded-xl overflow-hidden max-w-sm">
                        <button onClick={removeMedia} className="absolute top-2 right-2 bg-gray-900/80 text-white rounded-full p-1 hover:bg-black z-10">
                            <X className="w-4 h-4" />
                        </button>
                        {linkPreview.image && (
                            <div className="h-32 bg-gray-100 overflow-hidden">
                                <img src={linkPreview.image} alt={linkPreview.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-3 bg-gray-50">
                            <p className="font-bold text-sm line-clamp-1">{linkPreview.title}</p>
                            <p className="text-xs text-secondary-text line-clamp-1 mt-0.5">{linkPreview.description}</p>
                            <p className="text-xs text-[#0085ff] mt-1">{new URL(linkPreview.url).hostname}</p>
                        </div>
                    </div>
                )}

                {videoEmbed && (
                    <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-200 max-w-sm group">
                        <button onClick={removeMedia} className="absolute top-2 right-2 bg-gray-900/80 text-white rounded-full p-1 hover:bg-black z-10">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="aspect-video bg-black flex items-center justify-center relative">
                            {videoEmbed.thumbnail ? (
                                <img src={videoEmbed.thumbnail} alt={videoEmbed.title} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <div className="absolute inset-0 bg-neutral-800" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-black/70 transition-colors">
                                    <Play className="w-6 h-6 text-white" fill="currentColor" />
                                </div>
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 text-xs font-medium text-heading line-clamp-1">
                            {videoEmbed.title}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 hover:bg-blue-50 rounded-full transition-colors text-[#0085ff]"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 mr-1">
                            <div className="relative w-[28px] h-[28px] flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-100"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                    <circle
                                        className="transition-colors duration-200"
                                        strokeWidth="8"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={Math.max(0, 251.2 - (251.2 * charPercent) / 100)}
                                        strokeLinecap="round"
                                        stroke={getMeterColor()}
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                </svg>
                            </div>
                            <div className="w-[30px] flex justify-center">
                                <span className={`text-sm ${charCount >= charLimit ? "text-red-500" : charCount >= charLimit - 20 ? "text-orange-500" : "text-secondary-text"}`}>
                                    {charLimit - charCount}
                                </span>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-200 hidden sm:block mx-1" />
                        </div>
                        <button
                            onClick={onPost}
                            disabled={isPosting || !canPost || isUploading || charCount > charLimit}
                            className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors disabled:opacity-50 text-sm py-1.5 px-5 flex items-center gap-2"
                        >
                            {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
