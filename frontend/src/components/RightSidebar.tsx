"use client";

import { Search, TrendingUp, MoreHorizontal } from "lucide-react";

export default function RightSidebar() {
  return (
    <aside className="w-80 h-screen sticky top-0 hidden lg:flex flex-col gap-4 px-4 py-4 border-l border-secondary/50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search"
          className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-secondary text-foreground focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
        />
      </div>

      <div className="bg-secondary/30 rounded-2xl p-4 border border-secondary/50">
        <h2 className="text-xl font-bold mb-4">Trending</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-start group cursor-pointer">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Trending in Tech</span>
                <span className="font-bold">#AetherOS</span>
                <span className="text-sm text-gray-500">12.5k posts</span>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary/30 rounded-2xl p-4 border border-secondary/50">
        <h2 className="text-xl font-bold mb-4">Who to follow</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold">
                  {i === 1 ? "AI" : i === 2 ? "US" : "EV"}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Aether Bot {i}</span>
                  <span className="text-xs text-gray-500">@aether_bot_{i}</span>
                </div>
              </div>
              <button className="bg-foreground text-background px-4 py-1.5 rounded-full text-sm font-bold hover:bg-foreground/90 transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-xs text-gray-500 px-4 mt-auto">
        <div className="flex flex-wrap gap-2">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Cookie Policy</span>
          <span>Accessibility</span>
          <span>Ads info</span>
          <span>More...</span>
          <span>© 2026 Aether, Inc.</span>
        </div>
      </footer>
    </aside>
  );
}
