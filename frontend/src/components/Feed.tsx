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
import { useMediaComposer } from "@/hooks/useMediaComposer";
import PostComposer from "@/components/PostComposer";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("Discover");
  const [posts, setPosts] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const composer = useMediaComposer();
  const router = useRouter();

  const handleOpenReply = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    setSelectedPost(post);
    setReplyModalOpen(true);
  };


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

  const handlePost = async () => {
    if (!composer.canPost) return;
    setIsPosting(true);

    try {
      const mediaPayload = composer.getMediaPayload();

      await api.post("/social/posts", {
        content: composer.content,
        media: mediaPayload ? JSON.stringify(mediaPayload) : null
      });

      composer.clearComposer();
      fetchFeed();
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setIsPosting(false);
    }
  };

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
      <PostComposer
        currentUser={currentUser}
        composer={composer}
        onPost={handlePost}
        isPosting={isPosting}
      />

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
          posts.map((post) => {
            const isRetweet = post.type === "RETWEET";
            const displayPost = isRetweet && post.parent ? post.parent : post;
            const retweeterUser = isRetweet ? post.user : null;

            return (
              <article key={post.id} onClick={() => router.push(`/post/${displayPost.id}`)} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer group">
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
                    {/* Header */}
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
                      <div className="ml-auto relative group/more">
                        <div className="p-1.5 hover:bg-blue-50 rounded-full transition-colors cursor-pointer">
                          <MoreHorizontal className="w-[18px] h-[18px] text-secondary-text opacity-0 group-hover:opacity-100 transition-opacity" />
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

                    {/* Post text + media */}
                    <div className="mt-0.5">
                      <PostContent content={displayPost.content} media={displayPost.media} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                      {/* Reply */}
                      <div
                        className="flex items-center gap-0.5 group/action cursor-pointer"
                        onClick={(e) => handleOpenReply(e, displayPost)}
                      >
                        <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                          <MessageCircle className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                        </div>
                        <span className="text-[13px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors">{displayPost._count?.children || ""}</span>
                      </div>

                      {/* Retweet */}
                      <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'RETWEET'); }}>
                        <div className="p-2 rounded-full group-hover/action:bg-green-50 transition-colors">
                          <Repeat2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                        </div>
                        <span className="text-[13px] text-secondary-text group-hover/action:text-green-600 transition-colors">{displayPost.retweetsCount || ""}</span>
                      </div>

                      {/* Like */}
                      <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'LIKE'); }}>
                        <div className="p-2 rounded-full group-hover/action:bg-pink-50 transition-colors">
                          <Heart className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                        </div>
                        <span className="text-[13px] text-secondary-text group-hover/action:text-pink-600 transition-colors">{displayPost.likesCount || ""}</span>
                      </div>

                      {/* Share */}
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
          })
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
