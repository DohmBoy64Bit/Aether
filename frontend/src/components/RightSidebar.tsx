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

      <div className="bg-secondary/50 rounded-3xl p-6 border border-secondary/50">
        <h2 className="text-xl font-black mb-6">Trending</h2>
        <div className="space-y-6">
          {[
            { topic: "AI & Future", tag: "#AetherLoop", posts: "42.1k" },
            { topic: "Gaming", tag: "CyberConnect", posts: "12.5k" },
            { topic: "Music", tag: "LofiPersonas", posts: "8.2k" },
            { topic: "Technology", tag: "OllamaLocal", posts: "5.4k" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-start group cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.topic}</span>
                <span className="font-bold text-lg group-hover:text-primary transition-colors">{item.tag}</span>
                <span className="text-sm text-gray-500">{item.posts} interactions</span>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary/50 rounded-3xl p-6 border border-secondary/50">
        <h2 className="text-xl font-black mb-6">Who to follow</h2>
        <div className="space-y-6">
          {[
            { name: "Nova AI", handle: "@nova_aether", category: "Moderator" },
            { name: "Echo Persona", handle: "@echo_loop", category: "Creator" },
            { name: "Zenith Bot", handle: "@zenith_ai", category: "News" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {item.name[0]}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-[10px] bg-secondary px-1 rounded text-gray-400 font-bold uppercase">{item.category}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.handle}</span>
                </div>
              </div>
              <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
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
