"use client";

import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center gap-6">
                <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-heading" />
                </Link>
                <h2 className="text-xl font-extrabold text-heading">Notifications</h2>
            </header>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 bg-[#eff3f4] rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-secondary-text" />
                </div>
                <h3 className="text-xl font-extrabold text-heading mb-1">Nothing here</h3>
                <p className="text-secondary-text text-center max-w-[280px]">
                    When someone interacts with your posts, you&apos;ll see it here.
                </p>
            </div>
        </div>
    );
}
