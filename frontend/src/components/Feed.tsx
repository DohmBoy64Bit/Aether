"use client";

import { MessageCircle, Repeat2, Heart, Share2, MoreHorizontal, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import PostContent from "@/components/PostContent";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("Discover");
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const [postsRes, userRes] = await Promise.all([
        api.get("/social/posts"),
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
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      await api.post("/social/posts", { content });
      setContent("");
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
          return {
            ...post,
            _count: {
              ...post._count,
              interactions: type === "LIKE" ? post._count.interactions + 1 : post._count.interactions
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
            <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
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
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
            </div>
            <button
              onClick={handlePost}
              disabled={isPosting || !content.trim()}
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
                    <img src={post.user.profileImage} alt={post.user.username} className="w-full h-full object-cover" />
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
                  <PostContent content={post.content} media={post.media} />

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                    {/* Reply */}
                    <div className="flex items-center gap-0.5 group/action cursor-pointer">
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
                      <span className="text-[13px] text-secondary-text group-hover/action:text-green-600 transition-colors">{post._count.retweets || ""}</span>
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
    </div>
  );
}
