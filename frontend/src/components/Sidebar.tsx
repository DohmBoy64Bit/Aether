"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Hash, MessageSquare, Bell, Bookmark, List,
  Sparkles, User, MoreHorizontal, SquarePen,
  Search, MessageCircle, Settings
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Hash, label: "Explore", href: "/explore" },
  { icon: MessageSquare, label: "Chats", href: "/chat" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Bookmark, label: "Saved", href: "/saved" },
  { icon: List, label: "Lists", href: "/lists" },
  { icon: Sparkles, label: "Feeds", href: "/feeds" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: MoreHorizontal, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const updatedNavItems = navItems.map(item => {
    if (item.label === "Profile") {
      return { ...item, href: user ? `/profile/${user.username}` : "/profile" };
    }
    return item;
  });

  return (
    <aside className="w-[72px] xl:w-[275px] flex flex-col h-screen sticky top-0 py-2 px-2 xl:px-4">
      {/* Logo */}
      <div className="mb-2 flex justify-center xl:justify-start xl:px-3 py-3">
        <Link href="/" className="flex items-center gap-2 text-[#0085ff] hover:opacity-80 transition-opacity">
          <Sparkles className="w-8 h-8 fill-[#0085ff]" />
          <span className="text-xl font-black tracking-tight hidden xl:inline">AETHER</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 xl:px-4 py-3 rounded-full text-[15px] transition-colors hover:bg-gray-100",
                "justify-center xl:justify-start",
                isActive ? "font-bold text-heading" : "font-normal text-heading"
              )}
            >
              <item.icon className={cn("w-[26px] h-[26px]", isActive && "stroke-[2.5px]")} />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 mb-4 px-1 xl:px-0">
        <Link href="/" className="bg-[#0085ff] hover:bg-[#006fd6] text-white font-bold rounded-full transition-colors w-full py-3 flex items-center justify-center gap-2 text-[17px]">
          <SquarePen className="w-5 h-5 xl:hidden" />
          <span className="hidden xl:inline">New Post</span>
        </Link>
      </div>
    </aside>
  );
}
