"use client";

import { ArrowLeft, Plus, List } from "lucide-react";
import Link from "next/link";

export default function ListsPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/85 backdrop-blur-md z-10 border-b border-gray-200 px-4 h-[53px] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-heading" />
                    </Link>
                    <h2 className="text-xl font-extrabold text-heading">Lists</h2>
                </div>
                <button
                    onClick={() => alert("Create list coming soon!")}
                    className="flex items-center gap-1.5 bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors text-sm py-1.5 px-4"
                >
                    <Plus className="w-4 h-4" />
                    New
                </button>
            </header>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 bg-[#eff3f4] rounded-full flex items-center justify-center mb-4">
                    <List className="w-8 h-8 text-secondary-text" />
                </div>
                <h3 className="text-xl font-extrabold text-heading mb-1">You don&apos;t have any lists yet</h3>
                <p className="text-secondary-text text-center max-w-[300px]">
                    Lists let you curate and organize your feed. Create your first list to get started.
                </p>
                <button
                    onClick={() => alert("Create list coming soon!")}
                    className="mt-4 bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors text-sm py-2.5 px-6"
                >
                    Create a list
                </button>
            </div>
        </div>
    );
}
