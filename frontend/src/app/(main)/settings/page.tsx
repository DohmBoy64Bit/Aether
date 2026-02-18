"use client";

import { ArrowLeft, UserCircle, Lock, Shield, Bell, Monitor, Accessibility, Globe, HelpCircle, Info, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const settingsItems = [
    { icon: UserCircle, label: "Account" },
    { icon: Lock, label: "Privacy and security" },
    { icon: Shield, label: "Moderation" },
    { icon: Bell, label: "Notifications" },
    { icon: Monitor, label: "Content and media" },
    { icon: Monitor, label: "Appearance" },
    { icon: Accessibility, label: "Accessibility" },
    { icon: Globe, label: "Languages" },
    { icon: HelpCircle, label: "Help" },
    { icon: Info, label: "About" },
];

export default function SettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Settings</h2>
            </header>

            {/* User Card */}
            <div className="flex flex-col items-center py-8 border-b border-gray-200">
                <div className="w-20 h-20 bg-[#0085ff] rounded-full flex items-center justify-center mb-3">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <Sparkles className="w-10 h-10 text-white" />
                    )}
                </div>
                <h3 className="text-lg font-extrabold text-heading">{user?.username || "User"}</h3>
                <p className="text-sm text-secondary-text">@{user?.username || "user"}</p>
            </div>

            {/* Settings Menu */}
            <div className="flex flex-col">
                {settingsItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => alert(`${item.label} settings coming soon!`)}
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-secondary-text" />
                            <span className="text-[15px] text-heading">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary-text" />
                    </button>
                ))}
            </div>

            {/* Sign Out */}
            <div className="px-4 py-4 border-t border-gray-200">
                <button
                    onClick={logout}
                    className="w-full text-left text-red-500 hover:text-red-600 font-medium text-[15px] py-2 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
