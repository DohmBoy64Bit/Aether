"use client";

import { Search, TrendingUp, Sparkles, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const interests = [
    { label: "AI & Machine Learning", emoji: "🤖" },
    { label: "Creative Writing", emoji: "✍️" },
    { label: "Music Production", emoji: "🎵" },
    { label: "Game Development", emoji: "🎮" },
    { label: "Digital Art", emoji: "🎨" },
    { label: "Science & Tech", emoji: "🔬" },
];

const trending = [
    { rank: 1, name: "AI Personas", posts: "2.6K posts", category: "AI & Future", hot: true },
    { rank: 2, name: "Aether Loop", posts: "1.8K posts", category: "Technology" },
    { rank: 3, name: "Digital Minds", posts: "994 posts", category: "Philosophy" },
    { rank: 4, name: "Neural Networks", posts: "876 posts", category: "Science" },
    { rank: 5, name: "Creative AI", posts: "543 posts", category: "Art" },
];

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showInterests, setShowInterests] = useState(true);

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Explore</h2>
            </header>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-200">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-secondary-text" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for posts, users, or feeds"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-11 pr-4 py-2.5 rounded-full bg-[#eff3f4] text-heading text-sm placeholder:text-secondary-text border-none outline-none focus:ring-2 focus:ring-[#0085ff] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Your Interests */}
            {showInterests && (
                <div className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#0085ff]" />
                            <h3 className="text-lg font-extrabold text-heading">Your interests</h3>
                        </div>
                        <button onClick={() => setShowInterests(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-4 h-4 text-secondary-text" />
                        </button>
                    </div>
                    <p className="text-sm text-secondary-text mb-3">Your interests help us find what you like!</p>
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                            <button
                                key={interest.label}
                                className="flex items-center gap-1.5 bg-[#eff3f4] hover:bg-[#e1e8eb] rounded-full px-3.5 py-2 text-sm font-medium text-heading transition-colors"
                            >
                                <span>{interest.emoji}</span>
                                <span>{interest.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending */}
            <div>
                <div className="px-4 py-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0085ff]" />
                    <h3 className="text-lg font-extrabold text-heading">Trending</h3>
                </div>
                {trending.map((item) => (
                    <div key={item.rank} className="flex justify-between items-start px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100">
                        <div className="flex gap-3">
                            <span className="text-secondary-text text-sm font-medium mt-0.5">{item.rank}.</span>
                            <div className="flex flex-col">
                                <span className="font-bold text-heading text-[15px]">{item.name}</span>
                                <span className="text-xs text-secondary-text">{item.posts} · {item.category}</span>
                            </div>
                        </div>
                        {item.hot && (
                            <span className="text-xs bg-[#0085ff] text-white px-2.5 py-1 rounded-full font-semibold">
                                🔥 Hot
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
