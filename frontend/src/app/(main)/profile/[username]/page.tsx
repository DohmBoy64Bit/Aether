"use client";

import { ArrowLeft, Calendar, Loader2, MoreHorizontal, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import api from "@/utils/api";
import { format } from "date-fns";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [profile, setProfile] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Posts");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [profileRes, userRes] = await Promise.all([
                    api.get(`/social/profiles/${username}`),
                    api.get("/auth/me").catch(() => ({ data: null }))
                ]);
                setProfile(profileRes.data);
                setCurrentUser(userRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [username]);

    if (isLoading) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-heading">User not found</h1>
                <Link href="/" className="text-[#0085ff] hover:underline mt-2 inline-block">Go home</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-heading leading-tight">{profile.username}</h2>
                    <span className="text-xs text-secondary-text">{profile._count.posts} posts</span>
                </div>
            </header>

            {/* Banner */}
            <div className="aspect-[3/1] bg-gradient-to-br from-[#0085ff] via-[#6dd5ed] to-[#2193b0] relative">
                {/* Avatar overlapping */}
                <div className="absolute -bottom-12 left-4">
                    <div className="w-[84px] h-[84px] rounded-full border-4 border-white bg-[#eff3f4] flex items-center justify-center text-3xl font-bold text-[#0085ff] overflow-hidden shadow-sm">
                        {profile.profileImage ? (
                            <img src={profile.profileImage} alt={profile.username} className="w-full h-full object-cover" />
                        ) : (
                            <span>{profile.username[0].toUpperCase()}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="pt-16 px-4 pb-3">
                {/* Action buttons */}
                <div className="flex justify-end gap-2 -mt-2 mb-3">
                    {currentUser?.id === profile.id ? (
                        <button onClick={() => alert('Edit Profile coming soon!')} className="bg-transparent border border-gray-300 text-[#0f1419] font-bold rounded-full transition-colors hover:bg-gray-50 py-1.5 px-5 text-sm">
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button onClick={() => alert('Coming soon!')} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-heading" />
                            </button>
                            <button onClick={() => alert('Messaging coming soon!')} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                                <MessageCircle className="w-4 h-4 text-heading" />
                            </button>
                            <button onClick={() => alert('Follow feature coming soon!')} className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors py-1.5 px-5 text-sm">
                                Follow
                            </button>
                        </>
                    )}
                </div>

                {/* Name & Handle */}
                <div className="mb-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-extrabold text-heading">{profile.username}</h1>
                        {profile.isAi && (
                            <span className="text-xs bg-blue-50 text-[#0085ff] px-2 py-0.5 rounded-full font-semibold">AI Persona</span>
                        )}
                    </div>
                    <span className="text-secondary-text text-[15px]">@{profile.username}</span>
                </div>

                {/* Bio */}
                <p className="text-heading text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
                    {profile.bio || "No bio yet."}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-secondary-text text-sm mb-3">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                    <div className="flex gap-1">
                        <span className="font-bold text-heading">{profile._count.posts}</span>
                        <span className="text-secondary-text">posts</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[53px] bg-white z-[5] border-b border-gray-200 flex">
                {["Posts", "Replies", "Media", "Likes"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center text-sm h-[53px] transition-colors relative ${activeTab === tab
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

            {/* Tab Content */}
            <div className="flex flex-col min-h-[200px]">
                <div className="p-12 text-center text-secondary-text">
                    <p className="text-base">
                        {activeTab === "Posts" && "No posts to show yet."}
                        {activeTab === "Replies" && "No replies yet."}
                        {activeTab === "Media" && "No media posts yet."}
                        {activeTab === "Likes" && "No liked posts yet."}
                    </p>
                </div>
            </div>
        </div>
    );
}
