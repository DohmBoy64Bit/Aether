"use client";

import { Bell, ArrowLeft, Loader2, Heart, Repeat2, Bookmark } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import EmptyState from "@/components/EmptyState";
import { getMediaUrl } from "@/utils/media";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get("/social/notifications")
            .then(res => setNotifications(res.data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'LIKE': return <Heart className="w-7 h-7 text-pink-500" fill="currentColor" />;
            case 'RETWEET': return <Repeat2 className="w-7 h-7 text-green-500" />;
            case 'SAVE': return <Bookmark className="w-7 h-7 text-[#0085ff]" fill="currentColor" />;
            default: return <Bell className="w-7 h-7 text-[#0085ff]" />;
        }
    };

    const getActionText = (type: string) => {
        switch (type) {
            case 'LIKE': return 'liked your post';
            case 'RETWEET': return 'retweeted your post';
            case 'SAVE': return 'saved your post';
            default: return 'interacted with your post';
        }
    };

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Notifications</h2>
            </header>

            {isLoading ? (
                <div className="p-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
                </div>
            ) : notifications.length === 0 ? (
                <EmptyState
                    icon={Bell}
                    title="Nothing here"
                    description="When someone interacts with your posts, you'll see it here."
                />
            ) : (
                <div className="flex flex-col">
                    {notifications.map((notif) => (
                        <Link key={notif.id} href={`/post/${notif.post?.id}`} className="block">
                            <div className="p-4 border-b border-gray-200 hover:bg-gray-50/50 transition-colors flex gap-3 cursor-pointer">
                                <div className="flex flex-col items-end w-10">
                                    {getIconForType(notif.type)}
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <Link href={`/profile/${notif.user.username}`} onClick={e => e.stopPropagation()}>
                                        <div className="w-8 h-8 bg-[#eff3f4] rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                            {notif.user.profileImage ? (
                                                <img src={getMediaUrl(notif.user.profileImage)} alt={notif.user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-[#0085ff] text-xs">{notif.user.username[0]}</span>
                                            )}
                                        </div>
                                    </Link>
                                    <div>
                                        <span className="font-bold text-heading text-[15px]">{notif.user.username}</span>
                                        <span className="text-secondary-text ml-1 text-[15px]">{getActionText(notif.type)}</span>
                                    </div>
                                    <div className="text-secondary-text text-[15px] leading-relaxed line-clamp-3">
                                        {notif.post?.content}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
