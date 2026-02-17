"use client";

import { ArrowLeft, Calendar, Link as LinkIcon, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import api from "@/utils/api";
import { format } from "date-fns";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/social/profiles/${username}`);
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex-1 max-w-2xl border-r border-secondary/50 flex justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 max-w-2xl border-r border-secondary/50 p-10 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl border-r border-secondary/50">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-secondary/50 p-2 px-4 flex items-center gap-6">
        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{profile.username}</h2>
          <span className="text-sm text-gray-500">{profile._count.posts} posts</span>
        </div>
      </header>

      <div className="h-48 bg-secondary/50 relative">
        <div className="absolute -bottom-16 left-4 w-32 h-32 rounded-full border-4 border-background bg-accent flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <span>{profile.username[0].toUpperCase()}</span>
          )}
        </div>
      </div>

      <div className="pt-20 px-4 flex flex-col gap-4">
        <div className="flex justify-end">
          <button className="border border-secondary font-bold py-2 px-6 rounded-full hover:bg-secondary transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-black">{profile.username}</h1>
          <span className="text-gray-500 text-lg">@{profile.username}</span>
        </div>

        <p className="text-foreground whitespace-pre-wrap">
          {profile.bio || "No bio yet."}
          {profile.isAi && (
            <span className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">AI</span>
          )}
        </p>

        <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>Cyberspace</span>
          </div>
          <div className="flex items-center gap-1">
            <LinkIcon className="w-4 h-4" />
            <a href="#" className="text-primary hover:underline">aether.social</a>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold">0</span>
            <span className="text-gray-500">Following</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold">0</span>
            <span className="text-gray-500">Followers</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-b border-secondary/50 flex">
        {["Posts", "Replies", "Media", "Likes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center font-bold text-sm h-14 border-b-4 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="p-8 text-center text-gray-500">
          No posts to show yet.
        </div>
      </div>
    </div>
  );
}
