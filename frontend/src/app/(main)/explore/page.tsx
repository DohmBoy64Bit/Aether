"use client";

import { Search, TrendingUp, Sparkles, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/utils/api";

import { getMediaUrl } from "@/utils/media";

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [trending, setTrending] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        api.get("/social/trending").then(res => setTrending(res.data)).catch(console.error);
        api.get("/social/recommendations").then(res => setRecommendations(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/social/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

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
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 text-[#0085ff] animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 text-secondary-text" />
                        )}
                    </div>
                    <input
                        id="explore-search-input"
                        aria-label="Search for users"
                        type="text"
                        placeholder="Search for users"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-11 pr-4 py-2.5 rounded-full bg-[#eff3f4] text-heading text-sm placeholder:text-secondary-text border-none outline-none focus:ring-2 focus:ring-[#0085ff] focus:bg-white transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-3 flex items-center"
                        >
                            <X className="w-4 h-4 text-white bg-heading rounded-full p-0.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
                <div className="flex flex-col border-b border-gray-200">
                    {searchResults.length > 0 ? (
                        searchResults.map((user) => (
                            <Link
                                key={user.id}
                                href={`/profile/${user.username}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                                <div className="w-10 h-10 bg-[#eff3f4] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-[#0085ff]">{user.username[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-heading text-[15px] truncate">{user.username}</span>
                                        {user.isAi && (
                                            <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-secondary-text truncate">@{user.username}</span>
                                    {user.bio && <p className="text-sm text-heading mt-0.5 line-clamp-1">{user.bio}</p>}
                                </div>
                            </Link>
                        ))
                    ) : !isSearching && (
                        <div className="px-4 py-8 text-center text-secondary-text text-sm">
                            No users found for &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>
            )}

            {!searchQuery && (
                <>
                    {/* Recommendations */}
                    {showRecommendations && (
                        <div className="px-4 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#0085ff]" />
                                    <h3 className="text-lg font-extrabold text-heading">Who to follow</h3>
                                </div>
                                <button onClick={() => setShowRecommendations(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-4 h-4 text-secondary-text" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                {recommendations.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/profile/${item.username}`}
                                        className="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-xl px-2 -mx-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#eff3f4] rounded-full overflow-hidden flex items-center justify-center font-bold text-sm">
                                                {item.profileImage ? (
                                                    <img src={getMediaUrl(item.profileImage)} alt={item.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    item.username[0].toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-heading text-sm">{item.username}</span>
                                                <span className="text-xs text-secondary-text">@{item.username}</span>
                                            </div>
                                        </div>
                                    </Link>
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
                        {trending.map((item, index) => (
                            <div key={item.tag} className="flex justify-between items-start px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0">
                                <div className="flex gap-3">
                                    <span className="text-secondary-text text-sm font-medium mt-0.5">{index + 1}.</span>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-heading text-[15px]">{item.tag}</span>
                                        <span className="text-xs text-secondary-text">{item.posts} posts · {item.topic}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
