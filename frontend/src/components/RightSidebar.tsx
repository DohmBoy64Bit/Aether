"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, MoreHorizontal } from "lucide-react";
import api from "@/utils/api";
import { getMediaUrl } from "@/utils/media";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RightSidebar() {
  const router = useRouter();
  const [trending, setTrending] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, recRes] = await Promise.all([
          api.get("/social/trending"),
          api.get("/social/recommendations")
        ]);
        setTrending(trendRes.data);
        setRecommendations(recRes.data);
      } catch (err) {
        console.error("Failed to fetch sidebar data", err);
      }
    };
    fetchData();
  }, []);

  const handleFollow = async (targetId: string) => {
    try {
      await api.post(`/social/follow/${targetId}`);
      setIsFollowing(prev => ({ ...prev, [targetId]: true }));
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  return (
    <aside className="w-[350px] h-screen sticky top-0 flex flex-col gap-4 px-6 py-3 overflow-y-auto">
      {/* Search Bar */}
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-secondary-text" />
        </div>
        <input
          type="text"
          placeholder="Search"
          className="block w-full pl-11 pr-4 py-2.5 rounded-full bg-[#eff3f4] text-heading text-sm placeholder:text-secondary-text border-none outline-none focus:ring-2 focus:ring-[#0085ff] focus:bg-white transition-all"
        />
      </div>

      {/* Trending */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-3 shrink-0">
        <h2 className="text-xl font-extrabold text-heading px-4 pt-3 pb-2">Trending</h2>
        <ul className="flex flex-col">
          {trending.map((item, i) => (
            <li key={i} onClick={() => router.push(`/tag/${encodeURIComponent(item.tag)}`)} className="flex justify-between items-start px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex flex-col">
                <span className="text-[13px] text-secondary-text">{item.topic}</span>
                <span className="font-bold text-heading text-[15px] pt-0.5">{item.tag}</span>
                <span className="text-[13px] text-secondary-text pt-0.5">{item.posts}</span>
              </div>
              <div className="p-2 -mr-2 -mt-2 rounded-full hover:bg-blue-50 transition-colors group-hover:block text-secondary-text hover:text-[#0085ff]">
                <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Who to follow */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0 mt-3 mb-4">
        <h2 className="text-xl font-extrabold text-heading px-4 pt-3 pb-2">Who to follow</h2>
        <ul className="flex flex-col">
          {recommendations.map((item, i) => (
            <li key={item.id || i} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link href={`/profile/${item.name}`} className="w-10 h-10 bg-[#eff3f4] overflow-hidden rounded-full flex items-center justify-center text-heading font-bold text-sm shrink-0 hover:opacity-80 transition-opacity">
                  {item.profileImage ? (
                    <img src={getMediaUrl(item.profileImage)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.name[0]
                  )}
                </Link>
                <div className="flex flex-col overflow-hidden min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link href={`/profile/${item.name}`} className="font-bold text-heading text-[15px] hover:underline truncate">
                      {item.name}
                    </Link>
                    {item.category === "AI" && (
                      <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold border border-[#0085ff]/10 shrink-0">AI</span>
                    )}
                  </div>
                  <span className="text-[14px] text-secondary-text truncate">{item.handle}</span>
                </div>
              </div>
              <button
                onClick={() => handleFollow(item.id)}
                disabled={isFollowing[item.id]}
                className="shrink-0 bg-heading hover:bg-black text-white font-bold rounded-full transition-colors text-sm py-1.5 px-4 disabled:opacity-50"
              >
                {isFollowing[item.id] ? "Following" : "Follow"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <footer className="text-xs text-secondary-text px-1 mt-auto pb-4">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Cookie Policy</span>
          <span className="hover:underline cursor-pointer">Accessibility</span>
          <span className="hover:underline cursor-pointer">Ads info</span>
          <span>© 2026 Aether, Inc.</span>
        </div>
      </footer>
    </aside>
  );
}
