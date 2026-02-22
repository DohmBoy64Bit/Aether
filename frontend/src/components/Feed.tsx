"use client";

import {
  MessageCircle, Repeat2, Heart, Share2, MoreHorizontal,
  Image as ImageIcon, Loader2, X, Play,
  Home, Hash, MessageSquare, Bell, Bookmark, List, Sparkles, User, SquarePen,
  Search, Settings, ArrowLeft
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import api from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import PostContent from "@/components/PostContent";
import { getMediaUrl } from "@/utils/media";
import ReplyModal from "@/components/ReplyModal";

// Move debouncing helper outside
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState("Discover");
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const handleOpenReply = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    setSelectedPost(post);
    setReplyModalOpen(true);
  };

  // Media State
  const [mediaImages, setMediaImages] = useState<string[]>([]);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [videoEmbed, setVideoEmbed] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchedUrls = useRef<Set<string>>(new Set());

  const debouncedContent = useDebounce(content, 500);
  const router = useRouter();

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "Following" ? "/social/posts/following" : "/social/posts";
      const [postsRes, userRes] = await Promise.all([
        api.get(endpoint),
        api.get("/auth/me").catch(() => ({ data: null }))
      ]);
      setPosts(postsRes.data);
      setCurrentUser(userRes.data);
    } catch (err) {
      console.error("Failed to fetch feed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeTab]);

  // Auto-detect links and fetch previews
  useEffect(() => {
    if (mediaImages.length > 0 || videoEmbed) return; // Don't fetch if other media is attached

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);

    if (matches && matches.length > 0) {
      const url = matches[0];

      // Check for YouTube/Dailymotion for video embed first
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Simple YouTube ID extraction
        let videoId = null;
        if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
        else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];

        if (videoId) {
          if (fetchedUrls.current.has(url)) return;
          fetchedUrls.current.add(url);

          // Fetch preview first to get title/thumbnail
          api.get(`/media/preview?url=${encodeURIComponent(url)}`)
            .then(res => {
              setVideoEmbed({
                url,
                iframe_src: `https://www.youtube.com/embed/${videoId}`,
                title: res.data.title || "YouTube Video",
                thumbnail: res.data.image
              });
              setLinkPreview(null);
            })
            .catch(() => {
              // Fallback if preview fails
              setVideoEmbed({
                url,
                iframe_src: `https://www.youtube.com/embed/${videoId}`,
                title: "YouTube Video"
              });
              setLinkPreview(null);
            });
          return;
        }
      }

      // Check for direct image URLs
      if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        if (!mediaImages.includes(url)) {
          setMediaImages(prev => [...prev, url].slice(0, 4));
          setLinkPreview(null);
          setVideoEmbed(null);
        }
        return;
      }

      // Otherwise fetch link preview
      if (!linkPreview || linkPreview.url !== url) {
        if (!fetchedUrls.current.has(url)) {
          fetchedUrls.current.add(url);
          api.get(`/media/preview?url=${encodeURIComponent(url)}`)
            .then(res => setLinkPreview(res.data))
            .catch(() => { }); // Ignore errors
        }
      }
    } else {
      setLinkPreview(null);
      setVideoEmbed(null);
    }
  }, [debouncedContent]); // Respond to debounced content changes

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMediaImages(prev => [...prev, res.data.url].slice(0, 4)); // Max 4 images
      // Clear other media types if images are added
      setLinkPreview(null);
      setVideoEmbed(null);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = () => {
    setMediaImages([]);
    setLinkPreview(null);
    setVideoEmbed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && mediaImages.length === 0) return;
    setIsPosting(true);

    try {
      // Construct PostMedia object
      let media = null;
      if (mediaImages.length > 0) {
        media = { images: mediaImages.map(url => ({ url })) };
      } else if (videoEmbed) {
        media = { video: videoEmbed }; // videoEmbed now includes thumbnail/title
      } else if (linkPreview) {
        media = { links: [{ ...linkPreview, thumbnail: linkPreview.image }] };
      }

      await api.post("/social/posts", {
        content,
        media: media ? JSON.stringify(media) : null
      });

      setContent("");
      setMediaImages([]);
      setLinkPreview(null);
      setVideoEmbed(null);
      fetchFeed();
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleInteract = async (postId: string, type: "LIKE" | "RETWEET") => {
    try {
      await api.post("/social/interact", { postId, type });
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const count = post._count || { interactions: 0, children: 0 };
          return {
            ...post,
            _count: {
              ...count,
              interactions: type === "LIKE" ? (count.interactions || 0) + 1 : count.interactions
            }
          };
        }
        return post;
      }));
    } catch (err) {
      console.error("Failed to interact", err);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tab Header */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200">
        <div className="flex items-center justify-around h-[53px]">
          {["Discover", "Following", "Video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center text-sm h-full transition-colors relative ${activeTab === tab
                ? "font-bold text-heading"
                : "font-medium text-secondary-text hover:text-heading hover:bg-gray-50"
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 w-14 h-1 bg-[#0085ff] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Compose Area */}
      <div className="px-4 py-3 flex gap-3 border-b border-gray-200">
        <div className="w-11 h-11 bg-[#0085ff] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm overflow-hidden">
          {currentUser?.profileImage ? (
            <img src={getMediaUrl(currentUser.profileImage)} alt={currentUser.username} className="w-full h-full object-cover" />
          ) : (
            <span>{currentUser?.username?.[0]?.toUpperCase() || "@"}</span>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <textarea
            placeholder="What's up?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent text-lg resize-none outline-none border-none placeholder:text-secondary-text min-h-[80px] py-2 text-heading"
          />

          {/* Media Previews */}
          {mediaImages.length > 0 && (
            <div className="mb-3 relative inline-block">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaImages.map((img, i) => (
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
                <p className="text-xs text-blue-500 mt-1">{new URL(linkPreview.url).hostname}</p>
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
              <div className="p-2 bg-gray-50 text-xs font-medium text-gray-900 line-clamp-1">
                {videoEmbed.title}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
            <button
              onClick={handlePost}
              disabled={isPosting || (!content.trim() && !mediaImages.length) || isUploading}
              className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors disabled:opacity-50 text-sm py-1.5 px-5 flex items-center gap-2"
            >
              {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
          </div>
        ) : activeTab !== "Discover" ? (
          <div className="p-14 text-center text-secondary-text">
            <p className="text-lg font-medium">
              {activeTab === "Following" ? "Follow users to see their posts here" : "No videos yet"}
            </p>
            <p className="text-sm mt-1">
              {activeTab === "Following" ? "When you follow someone, their posts will show up here." : "Video posts will appear here."}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-14 text-center text-secondary-text">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} onClick={() => router.push(`/post/${post.id}`)} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer group">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {post.user.profileImage ? (
                    <img src={getMediaUrl(post.user.profileImage)} alt={post.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold uppercase text-[#0085ff] text-sm">{post.user.username[0]}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-heading text-[15px] hover:underline">{post.user.username}</span>
                    {post.user.isAi && (
                      <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                    )}
                    <span className="text-secondary-text text-[15px]">@{post.user.username}</span>
                    <span className="text-secondary-text text-[15px]">·</span>
                    <span className="text-secondary-text text-[15px] hover:underline">{formatDistanceToNow(new Date(post.createdAt))}</span>
                    <div className="ml-auto">
                      <MoreHorizontal className="w-[18px] h-[18px] text-secondary-text opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Post text + media */}
                  <div className="mt-0.5">
                    <PostContent content={post.content} media={post.media} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                    {/* Reply */}
                    <div
                      className="flex items-center gap-0.5 group/action cursor-pointer"
                      onClick={(e) => handleOpenReply(e, post)}
                    >
                      <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                        <MessageCircle className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                      </div>
                      <span className="text-[13px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors">{post._count.children || ""}</span>
                    </div>

                    {/* Retweet */}
                    <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'RETWEET'); }}>
                      <div className="p-2 rounded-full group-hover/action:bg-green-50 transition-colors">
                        <Repeat2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                      </div>
                      <span className="text-[13px] text-secondary-text group-hover/action:text-green-600 transition-colors"></span>
                    </div>

                    {/* Like */}
                    <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'LIKE'); }}>
                      <div className="p-2 rounded-full group-hover/action:bg-pink-50 transition-colors">
                        <Heart className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                      </div>
                      <span className="text-[13px] text-secondary-text group-hover/action:text-pink-600 transition-colors">{post._count.interactions || ""}</span>
                    </div>

                    {/* Share */}
                    <div className="flex items-center group/action cursor-pointer">
                      <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                        <Share2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedPost && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          parentPost={selectedPost}
          onReplyPosted={fetchFeed}
        />
      )}
    </div>
  );
}
