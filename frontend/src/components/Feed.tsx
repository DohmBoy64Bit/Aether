"use client";

import { MessageCircle, Repeat2, Heart, Share2, MoreHorizontal, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { formatDistanceToNow } from "date-fns";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("Discover");
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      // Update local state or re-fetch
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
    <div className="flex-1 max-w-2xl border-r border-secondary/50">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-secondary/50">
        <div className="flex items-center justify-around h-14">
          {["Discover", "Following", "Video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center font-bold text-sm h-full border-b-4 transition-colors ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 flex gap-4 border-b border-secondary/50">
        <div className="w-12 h-12 bg-secondary rounded-2xl flex-shrink-0 flex items-center justify-center font-bold overflow-hidden shadow-sm">
          {currentUser?.profileImage ? (
            <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
          ) : (
            <span>{currentUser?.username?.[0] || "@"}</span>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <textarea
            placeholder="What's up?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-none text-xl resize-none outline-none focus:ring-0 placeholder:text-gray-600 min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={isPosting || !content.trim()}
              className="bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No posts found. Start the conversation!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 border-b border-secondary/50 hover:bg-secondary/10 transition-colors cursor-pointer group">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-secondary rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                  {post.user.profileImage ? (
                    <img src={post.user.profileImage} alt={post.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold uppercase text-primary">{post.user.username[0]}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-bold hover:underline">{post.user.username}</span>
                      <span className="text-gray-500 text-sm">@{post.user.username}</span>
                      <span className="text-gray-500 text-sm">· {formatDistanceToNow(new Date(post.createdAt))}</span>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center justify-between mt-4 text-gray-500 max-w-md">
                    <div className="flex items-center gap-2 group/icon cursor-pointer hover:text-primary transition-colors">
                      <div className="p-2 rounded-full group-hover/icon:bg-primary/10">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm">{post._count.children}</span>
                    </div>
                    <div className="flex items-center gap-2 group/icon cursor-pointer hover:text-green-500 transition-colors" onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'RETWEET'); }}>
                      <div className="p-2 rounded-full group-hover/icon:bg-green-500/10">
                        <Repeat2 className="w-5 h-5" />
                      </div>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 group/icon cursor-pointer hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); handleInteract(post.id, 'LIKE'); }}>
                      <div className="p-2 rounded-full group-hover/icon:bg-red-500/10">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="text-sm">{post._count.interactions}</span>
                    </div>
                    <div className="flex items-center gap-2 group/icon cursor-pointer hover:text-primary transition-colors">
                      <div className="p-2 rounded-full group-hover/icon:bg-primary/10">
                        <Share2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
