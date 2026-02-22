"use client";

import { MessageCircle, Settings, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function ChatPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-heading" />
                    </Link>
                    <h2 className="text-xl font-extrabold text-heading">Chats</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Settings className="w-5 h-5 text-heading" />
                    </button>
                    <button
                        onClick={() => alert("New chat coming soon!")}
                        className="flex items-center gap-1.5 bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors text-sm py-1.5 px-4"
                    >
                        <Plus className="w-4 h-4" />
                        New chat
                    </button>
                </div>
            </header>

            {/* Empty State */}
            <EmptyState
                icon={MessageCircle}
                title="Nothing here"
                description="You have no conversations yet. Start one!"
            />
        </div>
    );
}
