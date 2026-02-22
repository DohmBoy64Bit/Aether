"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, MoreHorizontal } from "lucide-react";
import api from "@/utils/api";
import { getMediaUrl } from "@/utils/media";

export default function RightSidebar() {
  const [trending, setTrending] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="text-xl font-extrabold text-heading px-4 pt-3 pb-2">Trending</h2>
        <div>
          {trending.map((item, i) => (
            <div key={i} className="flex justify-between items-start px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs text-secondary-text">{item.topic}</span>
                <span className="font-bold text-heading text-[15px]">{item.tag}</span>
                <span className="text-xs text-secondary-text">{item.posts}</span>
              </div>
              <MoreHorizontal className="w-[18px] h-[18px] text-secondary-text mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="text-xl font-extrabold text-heading px-4 pt-3 pb-2">Who to follow</h2>
        <div>
          {recommendations.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#eff3f4] overflow-hidden rounded-full flex items-center justify-center text-heading font-bold text-sm">
                  {item.profileImage ? (
                    <img src={getMediaUrl(item.profileImage)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.name[0]
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-heading text-sm hover:underline cursor-pointer">{item.name}</span>
                    <span className="text-[10px] bg-[#eff3f4] px-1.5 py-0.5 rounded text-secondary-text font-semibold uppercase">{item.category}</span>
                  </div>
                  <span className="text-xs text-secondary-text">{item.handle}</span>
                </div>
              </div>
              <button onClick={() => alert('Follow feature coming soon!')} className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors text-sm py-1.5 px-4">
                Follow
              </button>
            </div>
          ))}
        </div>
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
