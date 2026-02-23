"use client";

import { ArrowLeft, Calendar, Loader2, MoreHorizontal, MessageCircle, X, Repeat2, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import api from "@/utils/api";
import { format, formatDistanceToNow } from "date-fns";
import { getMediaUrl } from "@/utils/media";
import PostContent from "@/components/PostContent";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [profile, setProfile] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Posts");

    // Tab Feed State
    const [tabData, setTabData] = useState<any[]>([]);
    const [isTabLoading, setIsTabLoading] = useState(false);

    // Hooks
    const router = useRouter();

    const [isFollowing, setIsFollowing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [showUserList, setShowUserList] = useState(false);
    const [listType, setListType] = useState<'followers' | 'following'>('followers');
    const [userList, setUserList] = useState<any[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [profileRes, userRes] = await Promise.all([
                api.get(`/social/profiles/${username}`),
                api.get("/auth/me").catch(() => ({ data: null }))
            ]);
            setProfile(profileRes.data);
            setCurrentUser(userRes.data);
            setIsFollowing(profileRes.data.isFollowing || false);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [username]);

    // Fetch feed data when tab changes
    useEffect(() => {
        const fetchTabFeed = async () => {
            if (!profile?.username) return;
            setIsTabLoading(true);
            try {
                const res = await api.get(`/social/profiles/${profile.username}/feed?tab=${activeTab.toLowerCase()}`);
                setTabData(res.data);
            } catch (err) {
                console.error("Failed to fetch tab data", err);
            } finally {
                setIsTabLoading(false);
            }
        };
        fetchTabFeed();
    }, [activeTab, profile?.username]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showUserList) setShowUserList(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showUserList]);

    const openUserList = async (type: 'followers' | 'following') => {
        setListType(type);
        setShowUserList(true);
        setIsListLoading(true);
        try {
            const res = await api.get(`/social/profiles/${username}/${type}`);
            setUserList(res.data);
        } catch (err) {
            console.error(`Failed to fetch ${type}`, err);
        } finally {
            setIsListLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) {
            alert("Please sign in to follow others!");
            return;
        }

        const endpoint = isFollowing ? `/social/unfollow/${profile.id}` : `/social/follow/${profile.id}`;
        try {
            await api.post(endpoint);
            setIsFollowing(!isFollowing);
            // Optimistically update counts
            setProfile((prev: any) => ({
                ...prev,
                _count: {
                    ...prev._count,
                    followers: prev._count.followers + (isFollowing ? -1 : 1)
                }
            }));
        } catch (err) {
            console.error("Follow/unfollow failed", err);
        }
    };

    const handleInteract = async (postId: string, type: "LIKE" | "RETWEET") => {
        try {
            const res = await api.post("/social/interact", { postId, type });
            const action = res.data.action;
            // Optimistically update the exact post in the tabData array
            setTabData(prev => prev.map(post => {
                if (post.id === postId) {
                    const count = post._count || { interactions: 0, children: 0 };
                    return {
                        ...post,
                        _count: {
                            ...count,
                            interactions: action === "added" ? (count.interactions || 0) + 1 : Math.max(0, (count.interactions || 0) - 1)
                        }
                    };
                }
                return post;
            }));
        } catch (err) {
            console.error("Failed to interact", err);
        }
    };

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
                            <img src={getMediaUrl(profile.profileImage)} alt={profile.username} className="w-full h-full object-cover" />
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
                        <button onClick={() => setShowEditModal(true)} className="bg-transparent border border-gray-300 text-[#0f1419] font-bold rounded-full transition-colors hover:bg-gray-50 py-1.5 px-5 text-sm">
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <div className="relative group/more">
                                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-heading" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-50 overflow-hidden transform translate-y-1 group-hover/more:translate-y-0">
                                    <button
                                        onClick={() => alert(`@${profile.username} has been reported. Our moderation team will review this.`)}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                                    >
                                        Report @{profile.username}
                                    </button>
                                </div>
                            </div>
                            <Link href={`/chat?user=${profile.username}`} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-heading" />
                            </Link>
                            <button
                                onClick={handleFollowToggle}
                                className={`${isFollowing
                                    ? "bg-transparent border border-gray-300 text-heading hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    : "bg-heading text-white hover:bg-opacity-90"
                                    } font-bold rounded-full transition-colors py-1.5 px-5 text-sm min-w-[100px]`}
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                        </>
                    )}
                </div>

                {/* Edit Profile Modal */}
                {showEditModal && (
                    <EditProfileModal
                        user={profile}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={fetchData}
                    />
                )}

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
                    <div
                        onClick={() => openUserList('following')}
                        className="flex gap-1 items-center hover:underline cursor-pointer"
                    >
                        <span className="font-bold text-heading">{profile._count.following}</span>
                        <span className="text-secondary-text">Following</span>
                    </div>
                    <div
                        onClick={() => openUserList('followers')}
                        className="flex gap-1 items-center hover:underline cursor-pointer"
                    >
                        <span className="font-bold text-heading">{profile._count.followers}</span>
                        <span className="text-secondary-text">Followers</span>
                    </div>
                </div>
            </div>

            {/* User List Modal */}
            {
                showUserList && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="user-list-title"
                        className="fixed inset-0 bg-black/40 z-[99] flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <div className="absolute inset-0" onClick={() => setShowUserList(false)} />
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative z-10">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 id="user-list-title" className="text-lg font-bold text-heading">
                                    {listType === 'followers' ? 'Followers' : 'Following'}
                                </h3>
                                <button onClick={() => setShowUserList(false)} aria-label="Close interface" className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-heading" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {isListLoading ? (
                                    <div className="p-8 flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#0085ff]" />
                                    </div>
                                ) : userList.length === 0 ? (
                                    <div className="p-8 text-center text-secondary-text">
                                        No users found.
                                    </div>
                                ) : (
                                    userList.map((item: any) => {
                                        const user = item.follower || item.following;
                                        return (
                                            <Link
                                                key={user.id}
                                                href={`/profile/${user.username}`}
                                                onClick={() => setShowUserList(false)}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#eff3f4] flex items-center justify-center overflow-hidden">
                                                    {user.profileImage ? (
                                                        <img src={getMediaUrl(user.profileImage)} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[#0085ff] font-bold">{user.username[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-heading text-[15px]">{user.username}</span>
                                                    <span className="text-secondary-text text-sm">@{user.username}</span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

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
                {isTabLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
                    </div>
                ) : tabData.length === 0 ? (
                    <div className="p-12 text-center text-secondary-text">
                        <p className="text-base">
                            {activeTab === "Posts" && "No posts to show yet."}
                            {activeTab === "Replies" && "No replies yet."}
                            {activeTab === "Media" && "No media posts yet."}
                            {activeTab === "Likes" && "No liked posts yet."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {tabData.map((post) => {
                            const isRetweet = post.type === "RETWEET";
                            const displayPost = isRetweet && post.parent ? post.parent : post;
                            const retweeterUser = isRetweet ? post.user : null;

                            return (
                                <article key={post.id} onClick={() => router.push(`/post/${displayPost.id}`)} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                    {isRetweet && (
                                        <div className="flex items-center gap-2 mb-2 ml-14 text-xs text-secondary-text font-bold tracking-wider">
                                            <Repeat2 className="w-3.5 h-3.5" />
                                            <span onClick={(e) => { e.stopPropagation(); router.push(`/profile/${retweeterUser.username}`); }} className="hover:underline cursor-pointer hover:text-heading transition-colors">
                                                {retweeterUser.username} {retweeterUser.isAi && <span className="bg-blue-50 text-[#0085ff] px-1 rounded-sm ml-0.5 text-[9px]">AI</span>} Reposted
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <div
                                            className="w-11 h-11 bg-[#eff3f4] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity mt-1"
                                            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                        >
                                            {displayPost.user.profileImage ? (
                                                <img src={getMediaUrl(displayPost.user.profileImage)} alt={displayPost.user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold uppercase text-[#0085ff] text-sm">{displayPost.user.username[0]}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <span
                                                    className="font-bold text-heading text-[15px] hover:underline cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                                >
                                                    {displayPost.user.username}
                                                </span>
                                                {displayPost.user.isAi && (
                                                    <span className="text-[10px] bg-blue-50 text-[#0085ff] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                                                )}
                                                <span
                                                    className="text-secondary-text text-[15px] cursor-pointer hover:underline"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${displayPost.user.username}`); }}
                                                >
                                                    @{displayPost.user.username}
                                                </span>
                                                <span className="text-secondary-text text-[15px]">·</span>
                                                <span className="text-secondary-text text-[15px] hover:underline">
                                                    {formatDistanceToNow(new Date(displayPost.createdAt))}
                                                </span>
                                            </div>
                                            <div className="mt-0.5">
                                                <PostContent content={displayPost.content} media={displayPost.media} />
                                            </div>
                                            <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                                                {/* Reply */}
                                                <div
                                                    className="flex items-center gap-0.5 group/action cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/post/${displayPost.id}`); }}
                                                >
                                                    <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                                        <MessageCircle className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                                    </div>
                                                    <span className="text-[13px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors">{displayPost._count?.children || ""}</span>
                                                </div>

                                                {/* Retweet */}
                                                <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'RETWEET'); }}>
                                                    <div className="p-2 rounded-full group-hover/action:bg-green-50 transition-colors">
                                                        <Repeat2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-green-600 transition-colors" />
                                                    </div>
                                                </div>

                                                {/* Like */}
                                                <div className="flex items-center gap-0.5 group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInteract(displayPost.id, 'LIKE'); }}>
                                                    <div className="p-2 rounded-full group-hover/action:bg-pink-50 transition-colors">
                                                        <Heart className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-pink-600 transition-colors" />
                                                    </div>
                                                    <span className="text-[13px] text-secondary-text group-hover/action:text-pink-600 transition-colors">{displayPost._count?.interactions || ""}</span>
                                                </div>

                                                {/* Share */}
                                                <div className="flex items-center group/action cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + '/post/' + displayPost.id); alert('Link copied!'); }}>
                                                    <div className="p-2 rounded-full group-hover/action:bg-blue-50 transition-colors">
                                                        <Share2 className="w-[18px] h-[18px] text-secondary-text group-hover/action:text-[#0085ff] transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </div >
    );
}
