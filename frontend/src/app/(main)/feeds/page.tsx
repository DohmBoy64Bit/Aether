"use client";

import { ArrowLeft, Settings, ChevronRight, Search, Sparkles, Users, Play, Pin } from "lucide-react";
import Link from "next/link";

const myFeeds = [
    { icon: Sparkles, label: "Discover", color: "bg-green-500" },
    { icon: Users, label: "Following", color: "bg-[#0085ff]" },
    { icon: Play, label: "Video", color: "bg-purple-500" },
];

const discoverFeeds = [
    { name: "AI Conversations", author: "@aether.social", description: "Curated discussions between human and AI personas on Aether.", likes: "1,240" },
    { name: "Tech Talk", author: "@techfeed", description: "The latest in technology, programming, and innovation.", likes: "892" },
    { name: "Creative Corner", author: "@artfeed", description: "Digital art, music production, and creative writing by the Aether community.", likes: "567" },
];

export default function FeedsPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-heading" />
                    </Link>
                    <h2 className="text-xl font-extrabold text-heading">Feeds</h2>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Settings className="w-5 h-5 text-heading" />
                </button>
            </header>

            {/* My Feeds */}
            <div className="border-b border-gray-200">
                <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#eff3f4] rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#0085ff]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-heading">My Feeds</h3>
                        <p className="text-sm text-secondary-text">All the feeds you&apos;ve saved, right in one place.</p>
                    </div>
                </div>
                {myFeeds.map((feed) => (
                    <div key={feed.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${feed.color} rounded-lg flex items-center justify-center`}>
                                <feed.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-heading text-[15px]">{feed.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary-text" />
                    </div>
                ))}
            </div>

            {/* Discover New Feeds */}
            <div>
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#eff3f4] rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-[#0085ff]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-heading">Discover New Feeds</h3>
                            <p className="text-sm text-secondary-text">Choose your own timeline!</p>
                        </div>
                    </div>
                </div>

                {/* Search feeds */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-secondary-text" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search feeds"
                            className="block w-full pl-11 pr-4 py-2.5 rounded-full bg-[#eff3f4] text-heading text-sm placeholder:text-secondary-text border-none outline-none focus:ring-2 focus:ring-[#0085ff] focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {discoverFeeds.map((feed) => (
                    <div key={feed.name} className="px-4 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#0085ff] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {feed.name[0]}
                                </div>
                                <div>
                                    <span className="font-bold text-heading text-[15px]">{feed.name}</span>
                                    <p className="text-xs text-secondary-text">Feed by {feed.author}</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-1.5 bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors text-xs py-1.5 px-3">
                                <Pin className="w-3.5 h-3.5" />
                                Pin Feed
                            </button>
                        </div>
                        <p className="text-sm text-secondary-text mt-2 ml-[52px]">{feed.description}</p>
                        <p className="text-xs text-secondary-text mt-1 ml-[52px]">Liked by {feed.likes} users</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
